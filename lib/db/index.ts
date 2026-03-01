/**
 * lib/db/index.ts — DB Facade
 *
 * SPI 风格 Provider 注册与加载：
 *   - 配置 DB_PROVIDER=local  → LocalFileProvider
 *   - 配置 DB_PROVIDER=github → GitHubProvider（默认）
 *   - 未来扩展只需：新建 providers/xxx.ts，在 REGISTRY 注册，改一个环境变量
 *
 * 业务层（getSongs / searchSongs / ...）完全不感知 Provider 的存在。
 */
import type { DBProvider, DBData, Song, Playlist } from './types';
export type { Song, Playlist, DBData };

// ── SPI Provider Registry ─────────────────────────────────────────────────────
// key = DB_PROVIDER 配置值，value = 懒加载工厂函数（避免无关模块被 import）

type ProviderFactory = () => DBProvider;

const REGISTRY: Record<string, ProviderFactory> = {
  local: () => {
    const { LocalFileProvider } = require('./providers/local');
    return new LocalFileProvider() as DBProvider;
  },
  github: () => {
    const { GitHubProvider } = require('./providers/github');
    return new GitHubProvider() as DBProvider;
  },
  // 未来扩展示例（添加后改 DB_PROVIDER 即可，其他代码零改动）：
  // s3:  () => { const { S3Provider }  = require('./providers/s3');  return new S3Provider(); },
  // oss: () => { const { OSSProvider } = require('./providers/oss'); return new OSSProvider(); },
};

// ── 单例 Provider 加载 ────────────────────────────────────────────────────────

let _provider: DBProvider | null = null;

function getProvider(): DBProvider {
  if (_provider) return _provider;
  const name = process.env.DB_PROVIDER || 'github';
  const factory = REGISTRY[name];
  if (!factory) {
    throw new Error(
      `[MusicHub] 未知的 DB_PROVIDER: "${name}"。可用值: ${Object.keys(REGISTRY).join(' | ')}`
    );
  }
  _provider = factory();
  console.log(`[MusicHub] DB Provider 已加载: ${name}`);
  return _provider;
}

// ── 缓存层 ────────────────────────────────────────────────────────────────────

let cache: { data: DBData; fetchedAt: number } | null = null;
const CACHE_TTL = process.env.DB_PROVIDER === 'local' ? 3_000 : 30_000;

export async function getDB(): Promise<DBData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) return cache.data;
  try {
    const data = await getProvider().read();
    cache = { data, fetchedAt: now };
    return data;
  } catch (e) {
    console.error('[MusicHub] getDB failed:', e);
    return { songs: [], playlists: [], version: 1, updatedAt: new Date().toISOString() };
  }
}

async function saveDB(data: DBData, message = 'chore: update'): Promise<void> {
  data.updatedAt = new Date().toISOString();
  await getProvider().write(data, message);
  cache = { data, fetchedAt: Date.now() };
}

// ── 业务逻辑 — 与 Provider 完全解耦 ─────────────────────────────────────────

// Songs

export async function getSongs(opts: { limit?: number; offset?: number; sort?: string; decade?: string; tag?: string } = {}) {
  const db = await getDB();
  let songs = [...db.songs];
  if (opts.decade) songs = songs.filter(s => s.decade === opts.decade);
  if (opts.tag)    songs = songs.filter(s => {
    const tags = Array.isArray(s.tags) ? s.tags : String(s.tags || '').split(',').map(t => t.trim());
    return tags.some(t => t.toLowerCase() === opts.tag!.toLowerCase());
  });
  if (opts.sort === 'play_count')  songs.sort((a, b) => b.play_count - a.play_count);
  else if (opts.sort === 'like_count') songs.sort((a, b) => b.like_count - a.like_count);
  else songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const total = songs.length;
  const offset = opts.offset || 0;
  const limit  = opts.limit  || 20;
  return { songs: songs.slice(offset, offset + limit), total };
}

export async function getSongById(id: string): Promise<Song | null> {
  const db = await getDB();
  return db.songs.find(s => s.id === id) || null;
}

export async function createSong(song: Omit<Song, 'play_count' | 'like_count' | 'created_at'>): Promise<Song> {
  const db = await getDB();
  const newSong: Song = { ...song, play_count: 0, like_count: 0, created_at: new Date().toISOString() };
  db.songs.unshift(newSong);
  await saveDB(db, `feat: add song ${song.title}`);
  return newSong;
}

export async function updateSong(id: string, updates: Partial<Song>): Promise<Song | null> {
  const db = await getDB();
  const idx = db.songs.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.songs[idx] = { ...db.songs[idx], ...updates };
  await saveDB(db, `chore: update song ${db.songs[idx].title}`);
  return db.songs[idx];
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await getDB();
  const song = db.songs.find(s => s.id === id);
  if (song) {
    song.play_count = (song.play_count || 0) + 1;
    await saveDB(db, `stat: play ${song.title}`); // 必须 await，防止 Vercel serverless 提前退出
  }
}

// Search

export async function searchSongs(q: string, opts: { limit?: number; offset?: number } = {}) {
  const db = await getDB();
  const query = q.toLowerCase();
  const matched = db.songs.filter(s => {
    const tags = Array.isArray(s.tags) ? s.tags.join(',') : (s.tags || '');
    return (s.title  || '').toLowerCase().includes(query)
        || (s.artist || '').toLowerCase().includes(query)
        || (s.album  || '').toLowerCase().includes(query)
        || tags.toLowerCase().includes(query);
  });
  return { songs: matched.slice(opts.offset || 0, (opts.offset || 0) + (opts.limit || 20)), total: matched.length };
}

// Playlists

export async function getPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.playlists;
}

export async function getPlaylistById(id: string): Promise<(Playlist & { songs: Song[] }) | null> {
  const db = await getDB();
  const pl = db.playlists.find(p => p.id === id);
  if (!pl) return null;
  const songs = (pl.song_ids ?? []).map(sid => db.songs.find(s => s.id === sid)).filter(Boolean) as Song[];
  return { ...pl, songs };
}

export async function createPlaylist(playlist: Omit<Playlist, 'song_ids' | 'created_at'>): Promise<Playlist> {
  const db = await getDB();
  const newPl: Playlist = { ...playlist, song_ids: [], song_count: 0, created_at: new Date().toISOString() };
  db.playlists.push(newPl);
  await saveDB(db, `feat: create playlist ${playlist.name}`);
  return newPl;
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<boolean> {
  const db = await getDB();
  const pl = db.playlists.find(p => p.id === playlistId);
  if (!pl) return false;
  if (!(pl.song_ids ?? []).includes(songId)) {
    pl.song_ids = [...(pl.song_ids ?? []), songId];
    pl.song_count = pl.song_ids.length;
    await saveDB(db, `chore: add song to ${pl.name}`);
  }
  return true;
}

export function clearCache(): void { cache = null; }

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function getPages(): Promise<import('../blocks/types').PageDescriptor[]> {
  const db = await getDB();
  return (db as any).pages || [];
}

export async function savePage(page: import('../blocks/types').PageDescriptor): Promise<void> {
  const db = await getDB() as any;
  if (!db.pages) db.pages = [];
  const idx = db.pages.findIndex((p: any) => p.id === page.id);
  if (idx >= 0) db.pages[idx] = page;
  else db.pages.push(page);
  await saveDB(db, `Update page: ${page.slug}`);
}

export async function deletePage(id: string): Promise<void> {
  const db = await getDB() as any;
  db.pages = (db.pages || []).filter((p: any) => p.id !== id);
  await saveDB(db, `Delete page: ${id}`);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<import('./types').SiteSettings> {
  const db = await getDB();
  const { DEFAULT_SETTINGS } = await import('./types');
  return db.settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: import('./types').SiteSettings): Promise<void> {
  const db = await getDB();
  db.settings = settings;
  await saveDB(db, 'chore: update site settings');
}

// ─── Rankings（设置驱动） ─────────────────────────────────────────────────────

export async function getRankings() {
  const db       = await getDB();
  const { DEFAULT_SETTINGS } = await import('./types');
  const cfg      = db.settings?.rankings ?? DEFAULT_SETTINGS.rankings;
  const songs    = db.songs;

  // 按年代分组
  const decades = ['80s', '90s', '00s', '10s', '20s'];
  const byDecade = cfg.byDecade.enabled
    ? Object.fromEntries(
        decades
          .map(d => [
            d,
            songs
              .filter(s => s.decade === d)
              .sort((a, b) => b.play_count - a.play_count)
              .slice(0, cfg.byDecade.limitPerDecade),
          ])
          .filter(([, list]) => (list as any[]).length > 0)
      )
    : {};

  return {
    hot:      cfg.hot.enabled    ? { ...cfg.hot,    songs: [...songs].sort((a,b) => b.play_count - a.play_count).slice(0, cfg.hot.limit)    } : null,
    liked:    cfg.liked.enabled  ? { ...cfg.liked,  songs: [...songs].sort((a,b) => b.like_count  - a.like_count ).slice(0, cfg.liked.limit)  } : null,
    newest:   cfg.newest.enabled ? { ...cfg.newest, songs: [...songs].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, cfg.newest.limit) } : null,
    byDecade,
    config:   cfg,
  };
}


export async function patchSettings(patch: Record<string, any>): Promise<void> {
  const db = await getDB();
  (db as any).settings = { ...((db as any).settings || {}), ...patch };
  await saveDB(db as any, 'chore: update settings');
}
