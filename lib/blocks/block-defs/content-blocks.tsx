'use client'
/**
 * Content 积木定义 — 从旧 meta.ts + previews 迁移到 BlockDef 格式
 */
import React from 'react'
import type { BlockDef } from '../types/block-def'

// ─── hero-banner ──────────────────────────────────────────────────────────────
const HeroBannerRenderer: BlockDef['Renderer'] = ({ props }) => (
  <div
    style={{ background: (props.bgColor as string) || '#6366f1', color: (props.textColor as string) || '#fff' }}
    className="w-full py-16 px-8 text-center rounded-xl"
  >
    <h1 className="text-4xl font-bold">{(props.title as string) || '页面标题'}</h1>
    {props.subtitle != null && <p className="text-lg mt-3 opacity-80">{props.subtitle as string}</p>}
  </div>
)

export const heroBannerDef: BlockDef = {
  type: 'hero-banner',
  label: '横幅广告',
  icon: '🖼️',
  category: 'structure',
  tags: ['structure'],
  isContainer: false,
  defaultProps: { title: '欢迎来到 MusicHub', subtitle: '发现你喜爱的音乐', bgColor: '#6366f1', textColor: '#ffffff' },
  propSchema: [
    { key: 'title', label: '标题', type: 'text', default: '欢迎来到 MusicHub' },
    { key: 'subtitle', label: '副标题', type: 'text', default: '发现你喜爱的音乐' },
    { key: 'bgColor', label: '背景色', type: 'color', default: '#6366f1' },
    { key: 'textColor', label: '文字色', type: 'color', default: '#ffffff' },
  ],
  Renderer: HeroBannerRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">🖼️</span><div className="text-xs mt-1">横幅广告</div></div>,
}

// ─── search-bar ───────────────────────────────────────────────────────────────
const SearchBarRenderer: BlockDef['Renderer'] = ({ props }) => (
  <div className="py-6 px-4">
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-sm text-gray-400">{(props.placeholder as string) || '搜索…'}</span>
      </div>
      {props.tags != null && (
        <div className="flex gap-2 mt-2 justify-center">
          {String(props.tags).split(',').map((t: string) => (
            <span key={t} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-500">{t.trim()}</span>
          ))}
        </div>
      )}
    </div>
  </div>
)

export const searchBarDef: BlockDef = {
  type: 'search-bar',
  label: '搜索框',
  icon: '🔍',
  category: 'interactive',
  tags: ['interactive'],
  isContainer: false,
  defaultProps: { placeholder: '搜索歌曲、歌手…', tags: '流行,摇滚,民谣,电子' },
  propSchema: [
    { key: 'placeholder', label: '占位文字', type: 'text', default: '搜索歌曲、歌手…' },
    { key: 'tags', label: '推荐标签（逗号分隔）', type: 'text', default: '流行,摇滚,民谣,电子' },
  ],
  Renderer: SearchBarRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">🔍</span><div className="text-xs mt-1">搜索框</div></div>,
}

// ─── chart-list ───────────────────────────────────────────────────────────────
const ChartListRenderer: BlockDef['Renderer'] = ({ props }) => (
  <div className="p-4">
    <h3 className="text-lg font-bold mb-3">{(props.title as string) || '热播榜单'}</h3>
    <div className="space-y-2">
      {Array.from({ length: Math.min(Number(props.limit) || 5, 5) }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
          <span className="text-sm font-bold text-gray-300 w-6 text-center">{i + 1}</span>
          <div className="w-8 h-8 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-2.5 bg-gray-200 rounded w-2/3" />
            <div className="h-2 bg-gray-100 rounded w-1/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const chartListDef: BlockDef = {
  type: 'chart-list',
  label: '榜单卡',
  icon: '📊',
  category: 'music',
  tags: ['music'],
  isContainer: false,
  defaultProps: { source: 'hot', layout: 'list', limit: 10, title: '热播榜单', dataSourceId: '' },
  propSchema: [
    { key: 'dataSourceId', label: '数据来源', type: 'datasource', default: '' },
    { key: 'title', label: '标题', type: 'text', default: '热播榜单' },
    {
      key: 'source', label: '数据来源(旧)', type: 'select', default: 'hot',
      options: [{ label: '热播榜', value: 'hot' }, { label: '最受欢迎', value: 'liked' }, { label: '最新上架', value: 'newest' }],
    },
    {
      key: 'layout', label: '展示方式', type: 'select', default: 'list',
      options: [{ label: '列表', value: 'list' }, { label: '网格', value: 'grid' }],
    },
    { key: 'limit', label: '显示数量', type: 'number', default: 10, min: 1, max: 50 },
  ],
  Renderer: ChartListRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">📊</span><div className="text-xs mt-1">榜单卡</div></div>,
}

// ─── decade-stack ─────────────────────────────────────────────────────────────
const DecadeStackRenderer: BlockDef['Renderer'] = ({ props }) => {
  const decades = (props.decades as string[]) || ['80s', '90s', '00s']
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">{(props.title as string) || '年代精选'}</h3>
      <div className="flex gap-2 overflow-hidden">
        {decades.slice(0, 4).map((d: string) => (
          <div key={d} className="flex-1 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 p-3 text-center"
            style={{ height: Number(props.cardHeight) || 120 }}>
            <span className="text-2xl font-bold text-indigo-400">{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const decadeStackDef: BlockDef = {
  type: 'decade-stack',
  label: '年代堆叠',
  icon: '🎵',
  category: 'music',
  tags: ['music'],
  isContainer: false,
  defaultProps: { decades: ['80s', '90s', '00s', '10s', '20s'], title: '年代精选', cardHeight: 120, dataSourceId: '' },
  propSchema: [
    { key: 'dataSourceId', label: '数据来源', type: 'datasource', default: '' },
    { key: 'title', label: '标题', type: 'text', default: '年代精选' },
    { key: 'cardHeight', label: '卡片高度(px)', type: 'number', default: 120, min: 60, max: 300 },
  ],
  Renderer: DecadeStackRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">🎵</span><div className="text-xs mt-1">年代堆叠</div></div>,
}

// ─── playlist-grid ────────────────────────────────────────────────────────────
const PlaylistGridRenderer: BlockDef['Renderer'] = ({ props }) => {
  const cols = Number(props.columns) || 3
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-3">{(props.title as string) || '精选歌单'}</h3>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: Math.min(Number(props.limit) || 6, 6) }).map((_, i) => (
          <div key={i} className="rounded-lg bg-gray-100 aspect-square flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const playlistGridDef: BlockDef = {
  type: 'playlist-grid',
  label: '歌单网格',
  icon: '🎶',
  category: 'music',
  tags: ['music'],
  isContainer: false,
  defaultProps: { limit: 8, columns: 3, title: '精选歌单', dataSourceId: '' },
  propSchema: [
    { key: 'dataSourceId', label: '数据来源', type: 'datasource', default: '' },
    { key: 'title', label: '标题', type: 'text', default: '精选歌单' },
    { key: 'limit', label: '显示数量', type: 'number', default: 8, min: 1, max: 20 },
    {
      key: 'columns', label: '列数', type: 'select', default: '3',
      options: [{ label: '2列', value: '2' }, { label: '3列', value: '3' }, { label: '4列', value: '4' }],
    },
  ],
  Renderer: PlaylistGridRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">🎶</span><div className="text-xs mt-1">歌单网格</div></div>,
}

// ─── stats-card ───────────────────────────────────────────────────────────────
const StatsCardRenderer: BlockDef['Renderer'] = ({ props }) => (
  <div className="p-4">
    <h3 className="text-lg font-bold mb-3">{(props.title as string) || '站点统计'}</h3>
    <div className="grid grid-cols-3 gap-3">
      {props.showSongs !== false && (
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-indigo-500">128</div>
          <div className="text-xs text-gray-500">首歌曲</div>
        </div>
      )}
      {props.showPlaylists !== false && (
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-500">24</div>
          <div className="text-xs text-gray-500">个歌单</div>
        </div>
      )}
      {props.showDecades !== false && (
        <div className="bg-pink-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-pink-500">5</div>
          <div className="text-xs text-gray-500">个年代</div>
        </div>
      )}
    </div>
  </div>
)

export const statsCardDef: BlockDef = {
  type: 'stats-card',
  label: '统计卡片',
  icon: '📈',
  category: 'data',
  tags: ['data'],
  isContainer: false,
  defaultProps: { title: '站点统计', showSongs: true, showPlaylists: true, showDecades: true, dataSourceId: '' },
  propSchema: [
    { key: 'dataSourceId', label: '数据来源', type: 'datasource', default: '' },
    { key: 'title', label: '标题', type: 'text', default: '站点统计' },
    { key: 'showSongs', label: '显示歌曲数', type: 'boolean', default: true },
    { key: 'showPlaylists', label: '显示歌单数', type: 'boolean', default: true },
    { key: 'showDecades', label: '显示年代跨度', type: 'boolean', default: true },
  ],
  Renderer: StatsCardRenderer,
  Thumbnail: () => <div className="text-center"><span className="text-2xl">📈</span><div className="text-xs mt-1">统计卡片</div></div>,
}

// ─── spacer ───────────────────────────────────────────────────────────────────
const SpacerRenderer: BlockDef['Renderer'] = ({ props }) => {
  const h = Number(props.height) || 40
  return (
    <div aria-hidden style={{ height: `${h}px`, position: 'relative' }}>
      {props.showLine != null && (
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent)',
        }} />
      )}
    </div>
  )
}

export const spacerDef: BlockDef = {
  type: 'spacer',
  label: '间距填充',
  icon: '↕️',
  category: 'spacing',
  tags: ['spacing'],
  isContainer: false,
  defaultProps: { height: 40, showLine: false },
  propSchema: [
    { key: 'height', label: '高度 (px)', type: 'range', default: 40, min: 8, max: 200, step: 4 },
    { key: 'showLine', label: '显示分割线', type: 'boolean', default: false },
  ],
  Renderer: SpacerRenderer,
  Thumbnail: () => (
    <div className="flex flex-col items-center justify-center gap-1 py-1 text-gray-400">
      <div className="w-full h-px bg-gray-200" />
      <span className="text-[10px]">↕ 间距</span>
      <div className="w-full h-px bg-gray-200" />
    </div>
  ),
}
