/**
 * lib/db/types.ts — 数据契约
 *
 * 所有 Provider 必须实现 DBProvider 接口。
 * 业务层只依赖这里的类型，永远不感知底层存储是什么。
 */

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
  tags: string | string[];
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

// ─── 榜单配置（管理端可调） ────────────────────────────────────────────────────

export interface RankingChartConfig {
  enabled: boolean;
  label: string;
  limit: number;          // TOP N，管理端配置
}

export interface SiteSettings {
  rankings: {
    hot:      RankingChartConfig;   // 热播榜：play_count DESC
    liked:    RankingChartConfig;   // 最受欢迎：like_count DESC
    newest:   RankingChartConfig;   // 新上架：created_at DESC
    byDecade: {
      enabled: boolean;
      limitPerDecade: number;       // 每个年代 TOP N
    };
  };
}

export const DEFAULT_SETTINGS: SiteSettings = {
  rankings: {
    hot:    { enabled: true, label: '热播榜',   limit: 20 },
    liked:  { enabled: true, label: '最受欢迎', limit: 20 },
    newest: { enabled: true, label: '新上架',   limit: 15 },
    byDecade: { enabled: true, limitPerDecade: 10 },
  },
};

// ─── 数据库结构 ─────────────────────────────────────────────────────────────────

import type { PageDescriptor } from '../blocks/types';

export interface DBData {
  songs: Song[];
  playlists: Playlist[];
  settings?: SiteSettings;
  pages?: PageDescriptor[];
  version: number;
  updatedAt: string;
}

/**
 * DBProvider — 存储提供者契约
 * 任何存储后端都必须实现这两个方法，业务层只认这个接口。
 */
export interface DBProvider {
  /** 读取完整数据库 */
  read(): Promise<DBData>;
  /** 写回完整数据库 */
  write(data: DBData, message?: string): Promise<void>;
}
