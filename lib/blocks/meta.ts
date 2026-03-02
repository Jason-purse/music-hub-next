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
import { LayoutBoxPreview as LayoutContainerPreview } from './previews/layout-box.preview'
import { LayoutSectionPreview as LayoutFlexPreview } from './previews/layout-section.preview'
import { LayoutGridPreview } from './previews/layout-grid.preview'
import { LayoutColumnsPreview } from './previews/layout-columns.preview'
import { LayoutStackPreview } from './previews/layout-stack.preview' 

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
  {
    type: 'layout-container',
    label: '容器',
    icon: '📦',
    defaultProps: { maxWidth: 1200, centered: true, paddingX: 24, paddingY: 48, background: 'transparent' },
    Preview: LayoutContainerPreview,
    fields: [
      { name: 'maxWidth', label: '最大宽度 (px)', type: 'number' },
      { name: 'centered', label: '居中', type: 'switch' },
      { name: 'paddingX', label: '横向内边距', type: 'number' },
      { name: 'paddingY', label: '纵向内边距', type: 'number' },
      { name: 'background', label: '背景色', type: 'color' },
    ],
  },
  {
    type: 'layout-flex',
    label: '弹性排列',
    icon: '⬜',
    defaultProps: { direction: 'row', gap: 16, align: 'stretch', justify: 'flex-start', wrap: false, padding: 0 },
    Preview: LayoutFlexPreview,
    fields: [
      { name: 'direction', label: '方向', type: 'select', options: [{ label: '水平', value: 'row' }, { label: '垂直', value: 'column' }] },
      { name: 'gap', label: '间距 (px)', type: 'number' },
      { name: 'align', label: '对齐', type: 'select', options: [{ label: '顶部', value: 'start' }, { label: '居中', value: 'center' }, { label: '底部', value: 'end' }, { label: '拉伸', value: 'stretch' }] },
      { name: 'justify', label: '主轴对齐', type: 'select', options: [{ label: '左', value: 'flex-start' }, { label: '中', value: 'center' }, { label: '右', value: 'flex-end' }, { label: '两端', value: 'space-between' }] },
      { name: 'wrap', label: '换行', type: 'switch' },
      { name: 'padding', label: '内边距', type: 'number' },
    ],
  },
  {
    type: 'layout-grid',
    label: '网格',
    icon: '🔳',
    defaultProps: { columns: 3, gap: 16, padding: 0 },
    Preview: LayoutGridPreview,
    fields: [
      { name: 'columns', label: '列数', type: 'number' },
      { name: 'gap', label: '间距 (px)', type: 'number' },
      { name: 'padding', label: '内边距', type: 'number' },
    ],
  },
  {
    type: 'layout-columns',
    label: '分栏',
    icon: '📑',
    defaultProps: { ratio: '1:1', gap: 24, align: 'start' },
    Preview: LayoutColumnsPreview,
    fields: [
      { name: 'ratio', label: '比例', type: 'select', options: [{ label: '1:1', value: '1:1' }, { label: '2:1', value: '2:1' }, { label: '1:2', value: '1:2' }] },
      { name: 'gap', label: '间距 (px)', type: 'number' },
      { name: 'align', label: '对齐', type: 'select', options: [{ label: '顶部', value: 'start' }, { label: '居中', value: 'center' }, { label: '底部', value: 'end' }] },
    ],
  },
  {
    type: 'layout-stack',
    label: '层叠',
    icon: '🔲',
    defaultProps: { minHeight: 320, align: 'center', justify: 'center' },
    Preview: LayoutStackPreview,
    fields: [
      { name: 'minHeight', label: '最小高度 (px)', type: 'number' },
      { name: 'align', label: '水平对齐', type: 'select', options: [{ label: '左', value: 'start' }, { label: '中', value: 'center' }, { label: '右', value: 'end' }] },
      { name: 'justify', label: '垂直对齐', type: 'select', options: [{ label: '顶', value: 'start' }, { label: '中', value: 'center' }, { label: '底', value: 'end' }] },
    ],
  },
  {
    type: 'layout-card',
    label: '卡片',
    icon: '🃏',
    defaultProps: { padding: 16, shadow: 'md', borderRadius: 8, bgColor: '#ffffff' },
    Preview: LayoutContainerPreview,
    fields: [
      { name: 'padding', label: '内边距', type: 'number' },
      { name: 'shadow', label: '阴影', type: 'select', options: [{ label: '无', value: 'none' }, { label: '小', value: 'sm' }, { label: '中', value: 'md' }, { label: '大', value: 'lg' }] },
      { name: 'borderRadius', label: '圆角', type: 'number' },
      { name: 'bgColor', label: '背景色', type: 'color' },
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
