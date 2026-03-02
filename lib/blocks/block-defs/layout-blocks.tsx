'use client'
/**
 * Layout 积木定义 — 6 个容器积木
 */
import React from 'react'
import type { BlockDef } from '../types/block-def'

// ─── ① layout-container（容器） ─────────────────────────────────────────────
const ContainerRenderer: BlockDef['Renderer'] = ({ props, slots }) => {
  const maxW = props.maxWidth ? `${props.maxWidth}px` : undefined
  const centered = props.centered !== false
  return (
    <div style={{
      paddingLeft: `${Number(props.paddingX) || 24}px`,
      paddingRight: `${Number(props.paddingX) || 24}px`,
      paddingTop: `${Number(props.paddingY) || 48}px`,
      paddingBottom: `${Number(props.paddingY) || 48}px`,
      background: (props.background as string) || 'transparent',
    }}>
      <div style={{
        maxWidth: maxW,
        margin: centered ? '0 auto' : undefined,
      }}>
        {slots?.content}
      </div>
    </div>
  )
}

export const layoutContainerDef: BlockDef = {
  type: 'layout-container',
  label: '容器',
  icon: '📦',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [{ name: 'content', label: '内容', accepts: '*' }],
  defaultProps: { maxWidth: 1200, centered: true, paddingX: 24, paddingY: 48, background: 'transparent' },
  propSchema: [
    { key: 'maxWidth', label: '最大宽度 (px)', type: 'number', default: 1200, min: 320, max: 1920, step: 40 },
    { key: 'centered', label: '居中', type: 'boolean', default: true },
    { key: 'paddingX', label: '横向内边距', type: 'range', default: 24, min: 0, max: 96, step: 4 },
    { key: 'paddingY', label: '纵向内边距', type: 'range', default: 48, min: 0, max: 120, step: 4 },
    { key: 'background', label: '背景色', type: 'color', default: 'transparent' },
  ],
  Renderer: ContainerRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-blue-300 bg-blue-50/30 rounded text-center">
      <span className="text-lg">📦</span>
      <div className="text-[10px] text-blue-500 mt-0.5">容器</div>
    </div>
  ),
}

// ─── ② layout-flex（弹性排列） ───────────────────────────────────────────────
const JUSTIFY_MAP: Record<string, string> = {
  'flex-start': 'flex-start', start: 'flex-start',
  center: 'center',
  'flex-end': 'flex-end', end: 'flex-end',
  'space-between': 'space-between', between: 'space-between',
  'space-around': 'space-around', around: 'space-around',
}
const ALIGN_MAP: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch',
}

const FlexRenderer: BlockDef['Renderer'] = ({ props, slots }) => (
  <div style={{
    display: 'flex',
    flexDirection: (props.direction as 'row' | 'column') || 'row',
    gap: `${Number(props.gap) || 16}px`,
    alignItems: ALIGN_MAP[(props.align as string) || 'stretch'] || 'stretch',
    justifyContent: JUSTIFY_MAP[(props.justify as string) || 'flex-start'] || 'flex-start',
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
    padding: `${Number(props.padding) || 0}px`,
  }}>
    {slots?.items}
  </div>
)

export const layoutFlexDef: BlockDef = {
  type: 'layout-flex',
  label: '弹性排列',
  icon: '⬜',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [{ name: 'items', label: '子元素', accepts: '*' }],
  defaultProps: { direction: 'row', gap: 16, align: 'stretch', justify: 'flex-start', wrap: false, padding: 0 },
  propSchema: [
    {
      key: 'direction', label: '方向', type: 'select', default: 'row',
      options: [{ label: '水平', value: 'row' }, { label: '垂直', value: 'column' }],
    },
    { key: 'gap', label: '间距 (px)', type: 'range', default: 16, min: 0, max: 64, step: 4 },
    {
      key: 'align', label: '对齐', type: 'select', default: 'stretch',
      options: [
        { label: '顶部', value: 'start' }, { label: '居中', value: 'center' },
        { label: '底部', value: 'end' }, { label: '拉伸', value: 'stretch' },
      ],
    },
    {
      key: 'justify', label: '排列', type: 'select', default: 'flex-start',
      options: [
        { label: '靠左', value: 'flex-start' }, { label: '居中', value: 'center' },
        { label: '靠右', value: 'flex-end' }, { label: '两端', value: 'space-between' },
        { label: '均匀', value: 'space-around' },
      ],
    },
    { key: 'wrap', label: '换行', type: 'boolean', default: false },
    { key: 'padding', label: '内边距 (px)', type: 'range', default: 0, min: 0, max: 64, step: 4 },
  ],
  Renderer: FlexRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-sky-300 bg-sky-50/30 rounded text-center">
      <div className="flex gap-0.5 justify-center mb-0.5">
        <div className="w-3 h-3 bg-sky-200 rounded-sm" />
        <div className="w-3 h-3 bg-sky-200 rounded-sm" />
        <div className="w-3 h-3 bg-sky-200 rounded-sm" />
      </div>
      <div className="text-[10px] text-sky-500">弹性排列</div>
    </div>
  ),
}

// ─── ③ layout-grid（网格） ───────────────────────────────────────────────────
const GridRenderer: BlockDef['Renderer'] = ({ props, slots }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${Number(props.cols) || 2}, 1fr)`,
    gap: `${Number(props.rowGap) ?? Number(props.gap) ?? 16}px ${Number(props.gap) || 16}px`,
    padding: `${Number(props.padding) || 0}px`,
    background: (props.background as string) || 'transparent',
  }}>
    {slots?.cells}
  </div>
)

export const layoutGridDef: BlockDef = {
  type: 'layout-grid',
  label: '网格',
  icon: '⊞',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [{ name: 'cells', label: '网格单元', accepts: '*' }],
  defaultProps: { cols: 2, gap: 16, rowGap: 16, padding: 0, background: 'transparent' },
  propSchema: [
    {
      key: 'cols', label: '列数', type: 'select', default: 2,
      options: [{ label: '2列', value: 2 }, { label: '3列', value: 3 }, { label: '4列', value: 4 }],
    },
    { key: 'gap', label: '列间距 (px)', type: 'range', default: 16, min: 0, max: 64, step: 4 },
    { key: 'rowGap', label: '行间距 (px)', type: 'range', default: 16, min: 0, max: 64, step: 4 },
    { key: 'padding', label: '内边距 (px)', type: 'range', default: 0, min: 0, max: 64, step: 4 },
    { key: 'background', label: '背景色', type: 'color', default: 'transparent' },
  ],
  Renderer: GridRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-green-300 bg-green-50/30 rounded text-center">
      <div className="grid grid-cols-2 gap-0.5 mb-0.5 mx-auto w-8">
        {[1,2,3,4].map(i => <div key={i} className="h-2.5 bg-green-200 rounded-sm" />)}
      </div>
      <div className="text-[10px] text-green-600">网格</div>
    </div>
  ),
}

// ─── ④ layout-columns（分栏） ────────────────────────────────────────────────
function ratioToFr(ratio: string): string {
  return ratio.split(':').map(n => `${n}fr`).join(' ')
}

const ColumnsRenderer: BlockDef['Renderer'] = ({ props, slots }) => {
  const ratio = (props.ratio as string) || '1:1'
  const parts = ratio.split(':')
  const slotNames = parts.length === 3 ? ['left', 'center', 'right'] : ['left', 'right']
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: ratioToFr(ratio),
      gap: `${Number(props.gap) || 24}px`,
      alignItems: (props.align as string) || 'start',
    }}>
      {slotNames.map(name => (
        <div key={name}>{slots?.[name]}</div>
      ))}
    </div>
  )
}

export const layoutColumnsDef: BlockDef = {
  type: 'layout-columns',
  label: '分栏',
  icon: '▥',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [
    { name: 'left', label: '左栏', accepts: '*' },
    { name: 'right', label: '右栏', accepts: '*' },
  ],
  defaultProps: { ratio: '1:1', gap: 24, align: 'start' },
  propSchema: [
    {
      key: 'ratio', label: '比例', type: 'select', default: '1:1',
      options: [
        { label: '1:1', value: '1:1' }, { label: '2:1', value: '2:1' },
        { label: '1:2', value: '1:2' }, { label: '3:1', value: '3:1' },
        { label: '1:3', value: '1:3' },
      ],
    },
    { key: 'gap', label: '间距 (px)', type: 'range', default: 24, min: 0, max: 64, step: 4 },
    {
      key: 'align', label: '对齐', type: 'select', default: 'start',
      options: [
        { label: '顶部', value: 'start' }, { label: '居中', value: 'center' },
        { label: '底部', value: 'end' }, { label: '拉伸', value: 'stretch' },
      ],
    },
  ],
  Renderer: ColumnsRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-amber-300 bg-amber-50/30 rounded text-center">
      <div className="flex gap-0.5 mb-0.5">
        <div className="flex-1 h-4 bg-amber-200 rounded-sm" />
        <div className="flex-1 h-4 bg-amber-200 rounded-sm" />
      </div>
      <div className="text-[10px] text-amber-600">分栏</div>
    </div>
  ),
}

// ─── ⑤ layout-stack（层叠） ──────────────────────────────────────────────────
const StackRenderer: BlockDef['Renderer'] = ({ props, slots }) => {
  const alignMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' }
  const justifyMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' }
  return (
    <div style={{
      position: 'relative',
      minHeight: `${Number(props.minHeight) || 320}px`,
    }}>
      {/* background layer */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {slots?.background}
      </div>
      {/* foreground layer */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: alignMap[(props.align as string) || 'center'] || 'center',
        justifyContent: justifyMap[(props.justify as string) || 'center'] || 'center',
        minHeight: `${Number(props.minHeight) || 320}px`,
      }}>
        {slots?.foreground}
      </div>
    </div>
  )
}

export const layoutStackDef: BlockDef = {
  type: 'layout-stack',
  label: '层叠',
  icon: '🔲',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [
    { name: 'background', label: '背景层', accepts: '*', max: 1 },
    { name: 'foreground', label: '前景层', accepts: '*' },
  ],
  defaultProps: { minHeight: 320, align: 'center', justify: 'center' },
  propSchema: [
    { key: 'minHeight', label: '最小高度 (px)', type: 'range', default: 320, min: 100, max: 800, step: 20 },
    {
      key: 'align', label: '水平对齐', type: 'select', default: 'center',
      options: [{ label: '左', value: 'start' }, { label: '中', value: 'center' }, { label: '右', value: 'end' }],
    },
    {
      key: 'justify', label: '垂直对齐', type: 'select', default: 'center',
      options: [{ label: '顶', value: 'start' }, { label: '中', value: 'center' }, { label: '底', value: 'end' }],
    },
  ],
  Renderer: StackRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-purple-300 bg-purple-50/30 rounded text-center">
      <div className="relative h-5 mb-0.5">
        <div className="absolute inset-0 bg-purple-100 rounded-sm" />
        <div className="absolute inset-1 bg-purple-200 rounded-sm" />
      </div>
      <div className="text-[10px] text-purple-600">层叠</div>
    </div>
  ),
}

// ─── ⑥ layout-card（卡片容器） ───────────────────────────────────────────────
const SHADOW_MAP: Record<string, string> = {
  none: '',
  sm: '0 1px 3px rgba(0,0,0,.1)',
  md: '0 4px 16px rgba(0,0,0,.08)',
  lg: '0 8px 32px rgba(0,0,0,.12)',
}

const CardRenderer: BlockDef['Renderer'] = ({ props, slots }) => (
  <div style={{
    padding: `${Number(props.padding) || 24}px`,
    borderRadius: `${Number(props.radius) || 12}px`,
    boxShadow: SHADOW_MAP[(props.shadow as string) || 'md'] || SHADOW_MAP.md,
    background: (props.background as string) || '#ffffff',
    border: props.border ? '1px solid #e5e7eb' : 'none',
  }}>
    {slots?.content}
  </div>
)

export const layoutCardDef: BlockDef = {
  type: 'layout-card',
  label: '卡片容器',
  icon: '🃏',
  category: 'layout',
  tags: ['layout'],
  isContainer: true,
  slots: [{ name: 'content', label: '卡片内容', accepts: '*' }],
  defaultProps: { padding: 24, radius: 12, shadow: 'md', background: '#ffffff', border: false },
  propSchema: [
    { key: 'padding', label: '内边距 (px)', type: 'range', default: 24, min: 0, max: 64, step: 4 },
    { key: 'radius', label: '圆角 (px)', type: 'range', default: 12, min: 0, max: 32, step: 2 },
    {
      key: 'shadow', label: '阴影', type: 'select', default: 'md',
      options: [
        { label: '无', value: 'none' }, { label: '小', value: 'sm' },
        { label: '中', value: 'md' }, { label: '大', value: 'lg' },
      ],
    },
    { key: 'background', label: '背景色', type: 'color', default: '#ffffff' },
    { key: 'border', label: '边框', type: 'boolean', default: false },
  ],
  Renderer: CardRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-gray-200 bg-white rounded-lg shadow-sm text-center">
      <span className="text-lg">🃏</span>
      <div className="text-[10px] text-gray-500 mt-0.5">卡片容器</div>
    </div>
  ),
}

// ─── ⑦ nav-dock（导航栏） ────────────────────────────────────────────────────
const NavDockRenderer: BlockDef['Renderer'] = ({ props }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    background: (props.theme as string) === 'dark' ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    gap: '8px',
    fontSize: '14px',
    color: (props.theme as string) === 'dark' ? '#e0e0e0' : '#333',
  }}>
    <span>🧭</span>
    <span style={{ fontWeight: 600 }}>NavDock</span>
    <span style={{ opacity: 0.6, fontSize: '12px' }}>
      ({props.position === 'fixed' ? '全局浮动' : '嵌入页面'})
    </span>
  </div>
)

export const navDockDef: BlockDef = {
  type: 'nav-dock',
  label: '底部导航栏',
  icon: '🧭',
  category: 'navigation',
  tags: ['navigation', 'nav', 'dock'],
  isContainer: false,
  defaultProps: {
    position: 'inline',
    items: [
      { label: '首页', icon: '🏠', href: '/' },
      { label: '搜索', icon: '🔍', href: '/search' },
    ],
    theme: 'light',
  },
  propSchema: [
    {
      key: 'position', label: '定位方式', type: 'select', default: 'inline',
      options: [{ label: '嵌入页面', value: 'inline' }, { label: '全局浮动', value: 'fixed' }],
    },
    {
      key: 'theme', label: '主题', type: 'select', default: 'light',
      options: [{ label: '浅色', value: 'light' }, { label: '深色', value: 'dark' }],
    },
  ],
  Renderer: NavDockRenderer,
  Thumbnail: () => (
    <div className="p-1.5 border border-dashed border-indigo-300 bg-indigo-50/30 rounded text-center">
      <span className="text-lg">🧭</span>
      <div className="text-[10px] text-indigo-600 mt-0.5">导航栏</div>
    </div>
  ),
}
