import { Octokit } from '@octokit/rest';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url: string;
  audio_url: string;
  duration: number;
  decade: string;
  category: string;
  tags: string;
  play_count: number;
  like_count: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover_url: string;
  song_ids?: string[];
  song_count?: number;
  created_at: string;
}

export interface DBData {
  songs: Song[];
  playlists: Playlist[];
  version: number;
  updatedAt: string;
}

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_DB_REPO || 'music-hub-db';
const BRANCH = process.env.GITHUB_DB_BRANCH || 'main';

let cache: { data: DBData; etag?: string; fetchedAt: number } | null = null;
const CACHE_TTL = 30_000; // 30秒缓存

async function fetchFile(path: string): Promise<{ content: string; sha: string }> {
  const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
  if (Array.isArray(data) || data.type !== 'file') throw new Error('Not a file');
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
}

async function writeFile(path: string, content: string, sha: string, message: string) {
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path, branch: BRANCH, message,
    content: Buffer.from(content).toString('base64'),
    sha,
  });
}

// 读取完整 DB
export async function getDB(): Promise<DBData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) return cache.data;

  try {
    const { content } = await fetchFile('db.json');
    const data: DBData = JSON.parse(content);
    cache = { data, fetchedAt: now };
    return data;
  } catch {
    // 初始化空 DB
    return { songs: [], playlists: [], version: 1, updatedAt: new Date().toISOString() };
  }
}

// 写入 DB（自动获取 sha）
async function saveDB(data: DBData, message: string) {
  data.updatedAt = new Date().toISOString();
  let sha = '';
  try {
    const file = await fetchFile('db.json');
    sha = file.sha;
  } catch {}
  await writeFile('db.json', JSON.stringify(data, null, 2), sha, message);
  cache = { data, fetchedAt: Date.now() };
}

// ─── Songs ────────────────────────────────────────────

export async function getSongs(opts: { limit?: number; offset?: number; sort?: string } = {}): Promise<{ songs: Song[]; total: number }> {
  const db = await getDB();
  const songs = [...db.songs];

  if (opts.sort === 'play_count') songs.sort((a, b) => b.play_count - a.play_count);
  else songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = songs.length;
  const offset = opts.offset || 0;
  const limit = opts.limit || 20;
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
  await saveDB(db, `Add song: ${song.title}`);
  return newSong;
}

export async function updateSong(id: string, updates: Partial<Song>): Promise<Song | null> {
  const db = await getDB();
  const idx = db.songs.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.songs[idx] = { ...db.songs[idx], ...updates };
  await saveDB(db, `Update song: ${db.songs[idx].title}`);
  return db.songs[idx];
}

export async function incrementPlayCount(id: string) {
  const db = await getDB();
  const song = db.songs.find(s => s.id === id);
  if (song) {
    song.play_count++;
    // 异步写，不等待（避免阻塞播放）
    saveDB(db, `Play: ${song.title}`).catch(() => {});
  }
}

// ─── Search ───────────────────────────────────────────

export async function searchSongs(q: string, opts: { limit?: number; offset?: number } = {}): Promise<{ songs: Song[]; total: number }> {
  const db = await getDB();
  const query = q.toLowerCase();
  const matched = db.songs.filter(s =>
    s.title.toLowerCase().includes(query) ||
    s.artist.toLowerCase().includes(query) ||
    s.album?.toLowerCase().includes(query)
  );
  const total = matched.length;
  return { songs: matched.slice(opts.offset || 0, (opts.offset || 0) + (opts.limit || 20)), total };
}

// ─── Playlists ─────────────────────────────────────────

export async function getPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.playlists;
}

export async function getPlaylistById(id: string): Promise<(Playlist & { songs: Song[] }) | null> {
  const db = await getDB();
  const pl = db.playlists.find(p => p.id === id);
  if (!pl) return null;
  const songs = pl.song_ids.map(sid => db.songs.find(s => s.id === sid)).filter(Boolean) as Song[];
  return { ...pl, songs };
}

export async function createPlaylist(playlist: Omit<Playlist, 'song_ids' | 'created_at'>): Promise<Playlist> {
  const db = await getDB();
  const newPl: Playlist = { ...playlist, song_ids: [], created_at: new Date().toISOString() };
  db.playlists.push(newPl);
  await saveDB(db, `Create playlist: ${playlist.name}`);
  return newPl;
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<boolean> {
  const db = await getDB();
  const pl = db.playlists.find(p => p.id === playlistId);
  if (!pl) return false;
  if (!pl.song_ids.includes(songId)) {
    pl.song_ids.push(songId);
    await saveDB(db, `Add song to playlist: ${pl.name}`);
  }
  return true;
}

// 清除缓存（迁移后用）
export function clearCache() { cache = null; }
