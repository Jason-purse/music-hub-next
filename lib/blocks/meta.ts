'use client'
/**
 * lib/blocks/meta.ts
 * Block 元数据 + 客户端 Preview 组件注册。
 */
import React from 'react'
import type { FieldDef } from './types'
import { HeroBannerPreview } from './previews/hero-banner.preview'
import { SearchBarPreview } from './previews/search-bar.preview'
import { ChartListPreview } from './previews/chart-list.preview'
import { StatsCardPreview } from './previews/stats-card.preview'
import { PlaylistGridPreview } from './previews/playlist-grid.preview'
import { DecadeStackPreview } from './previews/decade-stack.preview'

export interface BlockMeta {
  type: string
  label: string
  icon: string
  defaultProps: Record<string, any>
  fields: FieldDef[]
  Preview: React.ComponentType<{ props: any }>
}

const _meta: BlockMeta[] = [
  {
    type: 'hero-banner',
    label: '横幅广告',
    icon: '🖼️',
    defaultProps: { title: '欢迎来到 MusicHub', subtitle: '发现你喜爱的音乐', bgColor: '#6366f1', textColor: '#ffffff' },
    Preview: HeroBannerPreview,
    fields: [
      { name: 'title',     label: '标题',   type: 'text' },
      { name: 'subtitle',  label: '副标题', type: 'text' },
      { name: 'bgColor',   label: '背景色', type: 'color' },
      { name: 'textColor', label: '文字色', type: 'color' },
    ],
  },
  {
    type: 'search-bar',
    label: '搜索框',
    icon: '🔍',
    defaultProps: { placeholder: '搜索歌曲、歌手…', tags: '流行,摇滚,民谣,电子' },
    Preview: SearchBarPreview,
    fields: [
      { name: 'placeholder', label: '占位文字', type: 'text' },
      { name: 'tags', label: '推荐标签（逗号分隔）', type: 'text' },
    ],
  },
  {
    type: 'chart-list',
    label: '榜单卡',
    icon: '📊',
    defaultProps: { source: 'hot', layout: 'list', limit: 10, title: '热播榜单', dataSourceId: 'ds_songs_hot' },
    Preview: ChartListPreview,
    fields: [
      { name: 'dataSourceId', label: '数据来源', type: 'datasource', description: '选择数据源，不选则使用内置默认值' },
      { name: 'title', label: '标题', type: 'text' },
      {
        name: 'source', label: '数据来源(旧)', type: 'select',
        options: [
          { label: '热播榜', value: 'hot' },
          { label: '最受欢迎', value: 'liked' },
          { label: '最新上架', value: 'newest' },
        ],
      },
      {
        name: 'layout', label: '展示方式', type: 'select',
        options: [
          { label: '列表', value: 'list' },
          { label: '网格', value: 'grid' },
        ],
      },
      { name: 'limit', label: '显示数量', type: 'number', defaultValue: 10 },
    ],
  },
  {
    type: 'decade-stack',
    label: '年代堆叠',
    icon: '🎵',
    defaultProps: { decades: ['80s', '90s', '00s', '10s', '20s'], title: '年代精选', cardHeight: 120, dataSourceId: 'ds_songs_decade' },
    Preview: DecadeStackPreview,
    fields: [
      { name: 'dataSourceId', label: '数据来源', type: 'datasource', description: '选择数据源，不选则使用内置默认值' },
      { name: 'title', label: '标题', type: 'text' },
      {
        name: 'decades', label: '展示年代（多选）', type: 'select',
        options: [
          { label: '80年代', value: '80s' },
          { label: '90年代', value: '90s' },
          { label: '00年代', value: '00s' },
          { label: '10年代', value: '10s' },
          { label: '20年代', value: '20s' },
        ],
      },
      { name: 'cardHeight', label: '卡片高度(px)', type: 'number', defaultValue: 120 },
    ],
  },
  {
    type: 'playlist-grid',
    label: '歌单网格',
    icon: '🎶',
    defaultProps: { limit: 8, columns: 3, title: '精选歌单', dataSourceId: 'ds_playlists_all' },
    Preview: PlaylistGridPreview,
    fields: [
      { name: 'dataSourceId', label: '数据来源', type: 'datasource', description: '选择数据源，不选则使用内置默认值' },
      { name: 'title', label: '标题', type: 'text' },
      { name: 'limit', label: '显示数量', type: 'number', defaultValue: 8 },
      {
        name: 'columns', label: '列数', type: 'select',
        options: [
          { label: '2列', value: '2' },
          { label: '3列', value: '3' },
          { label: '4列', value: '4' },
        ],
      },
    ],
  },
  {
    type: 'stats-card',
    label: '统计卡片',
    icon: '📈',
    defaultProps: { title: '站点统计', showSongs: true, showPlaylists: true, showDecades: true, dataSourceId: 'ds_stats' },
    Preview: StatsCardPreview,
    fields: [
      { name: 'dataSourceId', label: '数据来源', type: 'datasource', description: '选择数据源，不选则使用内置默认值' },
      { name: 'title', label: '标题', type: 'text' },
      { name: 'showSongs', label: '显示歌曲数', type: 'switch', defaultValue: true },
      { name: 'showPlaylists', label: '显示歌单数', type: 'switch', defaultValue: true },
      { name: 'showDecades', label: '显示年代跨度', type: 'switch', defaultValue: true },
    ],
  },
]

class MetaRegistry {
  private map = new Map<string, BlockMeta>()

  constructor(metas: BlockMeta[]) {
    metas.forEach(m => this.map.set(m.type, m))
  }

  get(type: string) { return this.map.get(type) }
  getAll() { return Array.from(this.map.values()) }
}

export const blockMetaRegistry = new MetaRegistry(_meta)
