/**
 * lib/github-db.ts — 兼容层（保留供历史 import 路径使用）
 * 实际逻辑全部在 lib/db/index.ts
 */
export * from './db/index';
export type { Song, Playlist, DBData } from './db/types';
