// 内置数据源预设
// P0：db-query（直接查 db.json）+ internal-api（本站 API）

import { DataSource } from './types'

export const BUILTIN_DATASOURCES: DataSource[] = [
  {
    id: 'ds_songs_hot',
    name: '热播榜单',
    description: '按播放次数排序的歌曲列表',
    type: 'db-query',
    schema: 'song-list',
    config: { collection: 'songs', sort: 'play_count', sortDir: 'desc', limit: 20 },
    params: {
      limit: { type: 'number', default: 10, label: '显示数量' },
      sort: {
        type: 'string', default: 'play_count', label: '排序方式',
        options: ['play_count', 'like_count', 'created_at']
      },
    },
    cacheTtl: 60,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ds_songs_liked',
    name: '最多收藏',
    description: '按收藏数排序的歌曲列表',
    type: 'db-query',
    schema: 'song-list',
    config: { collection: 'songs', sort: 'like_count', sortDir: 'desc', limit: 20 },
    params: {
      limit: { type: 'number', default: 10, label: '显示数量' },
    },
    cacheTtl: 60,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ds_songs_newest',
    name: '最新上传',
    description: '按上传时间倒序的歌曲列表',
    type: 'db-query',
    schema: 'song-list',
    config: { collection: 'songs', sort: 'created_at', sortDir: 'desc', limit: 20 },
    params: {
      limit: { type: 'number', default: 10, label: '显示数量' },
    },
    cacheTtl: 30,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ds_songs_decade',
    name: '年代精选',
    description: '按年代筛选的歌曲列表',
    type: 'db-query',
    schema: 'song-list',
    config: { collection: 'songs', filter: {}, sort: 'play_count', sortDir: 'desc', limit: 10 },
    params: {
      'filter.decade': { type: 'string', default: '90s', label: '年代', options: ['80s', '90s', '00s', '10s', '20s'] },
      limit: { type: 'number', default: 10, label: '显示数量' },
    },
    cacheTtl: 120,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ds_playlists_all',
    name: '所有歌单',
    description: '全部歌单列表',
    type: 'db-query',
    schema: 'playlist-list',
    config: { collection: 'playlists', limit: 12 },
    params: {
      limit: { type: 'number', default: 6, label: '显示数量' },
    },
    cacheTtl: 60,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ds_stats',
    name: '站点统计',
    description: '歌曲数量、歌单数量等统计数字',
    type: 'internal-api',
    schema: 'stat-numbers',
    config: { endpoint: '/api/songs', params: { limit: 1 } },
    params: {},
    cacheTtl: 300,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
]
