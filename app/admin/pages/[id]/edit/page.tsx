'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { LayoutType, Block, FieldDef } from '@/lib/blocks/types'
import { LAYOUT_OPTIONS, COMMUNITY_LAYOUT_OPTIONS } from '@/lib/blocks/layouts'
import { blockMetaRegistry, BlockMeta } from '@/lib/blocks/meta'

interface PageData {
  id: string
  slug: string
  title: string
  layout: LayoutType
  slots: Record<string, Block[]>
  published: boolean
  layoutConfig?: { gutter?: number; padding?: number }
  draft?: { layout: LayoutType; slots: Record<string, Block[]>; layoutConfig?: { gutter?: number; padding?: number } }
}

function genId() { return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

// ─── 客户端预览面板 ─────────────────────────────────────────────────────────
// 直接渲染 page state，零延迟，无需保存

function ClientPreviewPanel({ page, device }: { page: PageData; device: 'desktop' | 'tablet' | 'mobile' }) {
  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }
  const width = deviceWidths[device]

  // 按 layout 决定各 slot 的排列方式
  const layoutConfig: Record<string, { cols: number; slots: string[] }> = {
    'single-col':        { cols: 1, slots: ['main'] },
    'two-col-sidebar':   { cols: 2, slots: ['main', 'sidebar'] },
    'hero-then-content': { cols: 1, slots: ['hero', 'content'] },
    'two-col-equal':     { cols: 2, slots: ['left', 'right'] },
    'three-col':         { cols: 3, slots: ['col1', 'col2', 'col3'] },
    'hero-full':         { cols: 1, slots: ['hero'] },
    'magazine':          { cols: 2, slots: ['hero', 'top-right', 'bottom-right'] },
  }
  const lc = layoutConfig[page.layout] || { cols: 1, slots: Object.keys(page.slots) }

  return (
    <div className="h-full overflow-y-auto bg-gray-100 flex flex-col items-center py-4">
      {/* 设备宽度指示 */}
      <div className="text-xs text-gray-400 mb-2">
        {device === 'mobile' ? '📱 375px' : device === 'tablet' ? '💻 768px' : '🖥️ 全宽'}
      </div>

      {/* 模拟页面 */}
      <div
        className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300"
        style={{ width, maxWidth: '100%', minHeight: 400 }}
      >
        {/* 模拟导航栏 */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-md" />
          <span className="font-semibold text-sm text-gray-800">MusicHub</span>
          <div className="ml-auto flex gap-1">
            <div className="w-12 h-2 bg-gray-200 rounded" />
            <div className="w-12 h-2 bg-gray-200 rounded" />
          </div>
        </div>

        {/* 渲染各 slot 的 blocks */}
        <div className={lc.cols > 1 ? `grid grid-cols-${lc.cols} gap-0` : 'block'}>
          {lc.slots.map(slotName => {
            const blocks = page.slots[slotName] || []
            return (
              <div key={slotName} className={slotName === 'main' || slotName === 'hero' ? 'col-span-1' : ''}>
                {blocks.length === 0 ? (
                  <div className="p-4 text-center text-gray-300 text-xs border border-dashed border-gray-200 m-2 rounded-lg">
                    {slotName} 区域（空）
                  </div>
                ) : (
                  blocks.map(block => {
                    const meta = blockMetaRegistry.get(block.type)
                    if (!meta?.Preview) return null
                    return (
                      <div key={block.id} className="pointer-events-none">
                        <meta.Preview props={block.props} />
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 实时提示 */}
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        实时预览（无需保存）
      </div>
    </div>
  )
}

// ─── 数据源选择组件 ────────────────────────────────────────────────────────────

function DataSourceSelect({ value, onChange, label, description }: {
  value: string
  onChange: (v: string) => void
  label: string
  description?: string
}) {
  const { data } = useSWR('/api/datasources', (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false })
  const sources = data?.datasources || []

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1">{description}</p>}
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300">
        <option value="">默认（内置数据）</option>
        {sources.map((ds: any) => (
          <option key={ds.id} value={ds.id}>{ds.name}</option>
        ))}
      </select>
    </div>
  )
}

// ─── 字段输入组件 ────────────────────────────────────────────────────────────

function FieldInput({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white'

  if (field.type === 'switch') return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-1'}`} />
    </button>
  )

  if (field.type === 'select') return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} className={cls}>
      {(field.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  if (field.type === 'textarea') return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} />
  )

  if (field.type === 'color') return (
    <div className="flex items-center gap-2">
      <input type="color" value={value ?? '#6366f1'} onChange={e => onChange(e.target.value)}
        className="w-10 h-9 rounded border border-gray-200 cursor-pointer p-0.5" />
      <input type="text" value={value ?? '#6366f1'} onChange={e => onChange(e.target.value)}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white" />
    </div>
  )

  if (field.type === 'datasource') return (
    <DataSourceSelect
      value={value || ''}
      onChange={onChange}
      label={field.label}
      description={field.description}
    />
  )

  return <input type={field.type === 'number' ? 'number' : 'text'} value={value ?? ''}
    onChange={e => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)} className={cls} />
}

// ─── 右栏：配置面板 ─────────────────────────────────────────────────────────

function ConfigPanel({
  block, onUpdate, onUpdateStyle, onUpdateLabel, onDelete, onClose
}: {
  block: Block
  onUpdate: (p: Record<string, any>) => void
  onUpdateStyle: (s: Partial<import('@/lib/blocks/types').BlockStyle>) => void
  onUpdateLabel: (label: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [styleOpen, setStyleOpen] = React.useState(false)
  const plugin = blockMetaRegistry.get(block.type)
  if (!plugin) return null
  const s = block.style || {}
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{plugin.icon}</span>
          <span className="font-semibold text-gray-800 text-sm">{plugin.label}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* ── 节点名称（TOC/画布标识） ─────────────────────── */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            节点名称
            <span className="ml-1 text-gray-300 font-normal">（用于时间轴目录、画布标识）</span>
          </label>
          <input
            type="text"
            value={block.label || ''}
            onChange={e => onUpdateLabel(e.target.value)}
            placeholder={`默认：${plugin.label}`}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <div className="border-t border-gray-100" />
        {plugin.fields.map(field => (
          <div key={field.name}>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{field.label}</label>
            <FieldInput
              field={field}
              value={block.props[field.name] ?? (field as any).defaultValue ?? plugin.defaultProps[field.name]}
              onChange={v => onUpdate({ ...block.props, [field.name]: v })}
            />
          </div>
        ))}

        {/* ── 外观样式折叠区 ────────��────────────────── */}
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setStyleOpen(o => !o)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
          >
            <span>🎨 外观样式</span>
            <span className="text-gray-300">{styleOpen ? '▲' : '▼'}</span>
          </button>

          {styleOpen && (
            <div className="mt-3 space-y-4">
              {/* 上下外边距 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">上边距 <span className="text-indigo-500">{s.marginTop ?? 0}px</span></label>
                  <input type="range" min={0} max={120} step={4}
                    value={s.marginTop ?? 0}
                    onChange={e => onUpdateStyle({ marginTop: Number(e.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">下边距 <span className="text-indigo-500">{s.marginBottom ?? 0}px</span></label>
                  <input type="range" min={0} max={120} step={4}
                    value={s.marginBottom ?? 0}
                    onChange={e => onUpdateStyle({ marginBottom: Number(e.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
              </div>

              {/* 内边距 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">横向内边距 <span className="text-indigo-500">{s.paddingX ?? 0}px</span></label>
                  <input type="range" min={0} max={64} step={4}
                    value={s.paddingX ?? 0}
                    onChange={e => onUpdateStyle({ paddingX: Number(e.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">纵向内边距 <span className="text-indigo-500">{s.paddingY ?? 0}px</span></label>
                  <input type="range" min={0} max={64} step={4}
                    value={s.paddingY ?? 0}
                    onChange={e => onUpdateStyle({ paddingY: Number(e.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
              </div>

              {/* 背景色 */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">背景色</label>
                <div className="flex gap-2 flex-wrap">
                  {['transparent','#ffffff','#f9fafb','#eff6ff','#fdf4ff','#f0fdf4','#fff7ed','#1f2937'].map(c => (
                    <button key={c}
                      onClick={() => onUpdateStyle({ bgColor: c })}
                      title={c}
                      className="w-7 h-7 rounded-lg border-2 transition"
                      style={{
                        background: c === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' : c,
                        borderColor: s.bgColor === c ? '#6366f1' : '#e5e7eb',
                      }}
                    />
                  ))}
                  <input type="color" value={s.bgColor && s.bgColor !== 'transparent' ? s.bgColor : '#ffffff'}
                    onChange={e => onUpdateStyle({ bgColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" title="自定义颜色" />
                </div>
              </div>

              {/* 圆角 + 阴影 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">圆角 <span className="text-indigo-500">{s.borderRadius ?? 0}px</span></label>
                  <input type="range" min={0} max={32} step={2}
                    value={s.borderRadius ?? 0}
                    onChange={e => onUpdateStyle({ borderRadius: Number(e.target.value) })}
                    className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">阴影</label>
                  <div className="flex gap-1.5">
                    {(['none','sm','md','lg'] as const).map(sh => (
                      <button key={sh}
                        onClick={() => onUpdateStyle({ shadow: sh })}
                        className={`flex-1 py-1 text-xs rounded-lg border transition ${s.shadow === sh || (!s.shadow && sh === 'none') ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >{sh === 'none' ? '无' : sh}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 重置 */}
              <button
                onClick={() => onUpdateStyle({ marginTop: 0, marginBottom: 0, paddingX: 0, paddingY: 0, bgColor: 'transparent', borderRadius: 0, shadow: 'none' })}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >重置外观</button>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 shrink-0">
        <button onClick={onDelete}
          className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-xl hover:bg-red-50 transition">
          删除此组件
        </button>
      </div>
    </div>
  )
}

// ─── 左栏：积木库 ────────────────────────────────────────────────────────────

const BLOCK_CATEGORIES = [
  {
    label: '🏗 结构',
    desc: '页面骨架与视觉焦点',
    types: ['hero-banner'],
  },
  {
    label: '🎵 音乐',
    desc: '榜单、年代、歌单',
    types: ['chart-list', 'decade-stack', 'playlist-grid'],
  },
  {
    label: '📊 数据',
    desc: '统计与概览',
    types: ['stats-card'],
  },
  {
    label: '🔍 交互',
    desc: '搜索与导航',
    types: ['search-bar'],
  },
  {
    label: '⬜ 间距',
    desc: '空白与分隔线',
    types: ['spacer'],
  },
]

function BlockLibrary() {
  const allPlugins = blockMetaRegistry.getAll()
  // 内置分类里已列出的 block types
  const builtinTypes = new Set(BLOCK_CATEGORIES.flatMap(c => c.types))
  // 社区插件 = 注册了但不在内置分类里的
  const communityPlugins = allPlugins.filter(p => !builtinTypes.has(p.type))

  return (
    <Droppable droppableId="palette" isDropDisabled={true} direction="vertical">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-5"
        >
          {/* ── 内置分类 ───────────────────────── */}
          {BLOCK_CATEGORIES.map(cat => {
            const metas = cat.types.map(t => blockMetaRegistry.get(t)).filter(Boolean) as BlockMeta[]
            if (metas.length === 0) return null
            return (
              <div key={cat.label}>
                <div className="mb-2 px-1">
                  <div className="text-xs font-semibold text-gray-600">{cat.label}</div>
                  {'desc' in cat && <div className="text-[10px] text-gray-300 mt-0.5">{(cat as any).desc}</div>}
                </div>
                <div className="space-y-1.5">
                  {metas.map((meta, index) => {
                    const globalIndex = allPlugins.findIndex(p => p.type === meta.type)
                    return (
                      <Draggable
                        key={`palette-${meta.type}`}
                        draggableId={`palette-${meta.type}`}
                        index={globalIndex >= 0 ? globalIndex : index}
                      >
                        {(provided, snapshot) => (
                          <>
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition select-none
                                ${snapshot.isDragging
                                  ? 'opacity-60 border-indigo-300 bg-indigo-50'
                                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                                }`}
                            >
                              <span className="text-xl shrink-0">{meta.icon}</span>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-700 leading-tight">{meta.label}</div>
                              </div>
                            </div>
                            {snapshot.isDragging && (
                              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white opacity-30 select-none">
                                <span className="text-xl shrink-0">{meta.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                              </div>
                            )}
                          </>
                        )}
                      </Draggable>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── 社区插件（动态，安装后出现）───── */}
          {communityPlugins.length > 0 && (
            <div>
              <div className="mb-2 px-1">
                <div className="text-xs font-semibold text-gray-600">🧩 社区插件</div>
                <div className="text-[10px] text-gray-300 mt-0.5">已安装的第三方积木</div>
              </div>
              <div className="space-y-1.5">
                {communityPlugins.map((meta, index) => {
                  const globalIndex = allPlugins.findIndex(p => p.type === meta.type)
                  return (
                    <Draggable
                      key={`palette-${meta.type}`}
                      draggableId={`palette-${meta.type}`}
                      index={globalIndex >= 0 ? globalIndex : index + 100}
                    >
                      {(provided, snapshot) => (
                        <>
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition select-none
                              ${snapshot.isDragging
                                ? 'opacity-60 border-purple-300 bg-purple-50'
                                : 'border-purple-100 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                              }`}
                          >
                            <span className="text-xl shrink-0">{meta.icon}</span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-700 leading-tight">{meta.label}</div>
                              <div className="text-[10px] text-purple-300">社区</div>
                            </div>
                          </div>
                          {snapshot.isDragging && (
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-purple-100 bg-white opacity-30 select-none">
                              <span className="text-xl shrink-0">{meta.icon}</span>
                              <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                            </div>
                          )}
                        </>
                      )}
                    </Draggable>
                  )
                })}
              </div>
            </div>
          )}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

// ─── Slot 标签映射 ────────────────────────────────────────────────────────────

const SLOT_LABELS: Record<string, string> = {
  main: '主区域',
  sidebar: '侧边栏',
  hero: 'Hero 区',
  content: '内容区',
  left: '左栏',
  right: '右栏',
  col1: '第一列',
  col2: '第二列',
  col3: '第三列',
}

// ─── 单个 Block 预览 ─────────────────────────────────────────────────────────

function BlockPreviewWrapper({ block }: { block: Block }) {
  const plugin = blockMetaRegistry.get(block.type)
  if (!plugin) return <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">未知组件</div>
  return <plugin.Preview props={block.props} />
}

// ─── Canvas Slot（可拖入区域） ────────────────────────────────────────────────

function CanvasSlot({
  slotName,
  blocks,
  selectedId,
  onSelect,
  onDelete,
}: {
  slotName: string
  blocks: Block[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (slotName: string, id: string) => void
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {SLOT_LABELS[slotName] || slotName}
        </span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-300">{blocks.length} 个组件</span>
      </div>

      <Droppable droppableId={`slot-${slotName}`} direction="vertical">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[80px] flex flex-col gap-2 p-2 rounded-2xl border-2 border-dashed transition-colors
              ${snapshot.isDraggingOver
                ? 'border-indigo-400 bg-indigo-50/60'
                : blocks.length === 0
                  ? 'border-gray-200 bg-gray-50/60'
                  : 'border-gray-100 bg-transparent'
              }`}
          >
            {blocks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex items-center justify-center py-6 text-sm text-gray-300">
                将积木拖到此处
              </div>
            )}

            {blocks.map((block, index) => (
              <Draggable key={block.id} draggableId={block.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer
                      ${selectedId === block.id
                        ? 'border-indigo-500 shadow-md shadow-indigo-100'
                        : 'border-transparent hover:border-indigo-200'
                      }
                      ${snapshot.isDragging ? 'opacity-60 shadow-2xl rotate-1' : ''}`}
                    onClick={() => onSelect(block.id)}
                  >
                    {/* 拖动手柄 + block 名称标签 */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-100">
                      <span
                        {...provided.dragHandleProps}
                        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg leading-none"
                      >
                        ⠿
                      </span>
                      <span className="text-xs text-gray-500">
                        {block.label
                          ? <><span className="text-indigo-400">{block.label}</span><span className="text-gray-300 ml-1">· {blockMetaRegistry.get(block.type)?.label}</span></>
                          : blockMetaRegistry.get(block.type)?.label
                        }
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(slotName, block.id) }}
                        className="ml-auto text-gray-300 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Block Preview */}
                    <div className="pointer-events-none">
                      <BlockPreviewWrapper block={block} />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// ─── 画布容器 ────────────────────────────────────────────────────────────────

function CanvasArea({
  page,
  selectedId,
  onSelect,
  onDelete,
  device,
}: {
  page: PageData
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (slotName: string, id: string) => void
  device: 'desktop' | 'tablet' | 'mobile'
}) {
  const ALL_LAYOUT_OPTIONS = [...LAYOUT_OPTIONS, ...COMMUNITY_LAYOUT_OPTIONS]
  const currentLayout = ALL_LAYOUT_OPTIONS.find(l => l.value === page.layout) || LAYOUT_OPTIONS[0]
  const slotNames = currentLayout.slotNames

  const widthClass = device === 'mobile' ? 'max-w-[390px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-full'

  const isMultiCol = ['two-col-sidebar', 'two-col-equal', 'three-col'].includes(page.layout)

  return (
    <div className={`mx-auto w-full ${widthClass} transition-all`}>
      {isMultiCol ? (
        <div className={`grid gap-4 ${page.layout === 'three-col' ? 'grid-cols-3' : page.layout === 'two-col-sidebar' ? 'grid-cols-[2fr_1fr]' : 'grid-cols-2'}`}>
          {slotNames.map(slotName => (
            <CanvasSlot
              key={slotName}
              slotName={slotName}
              blocks={page.slots[slotName] || []}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {slotNames.map(slotName => (
            <CanvasSlot
              key={slotName}
              slotName={slotName}
              blocks={page.slots[slotName] || []}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 主编辑器 ────────���───────────────────────────────────────────────────────

export default function PageEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [extraLayouts, setExtraLayouts] = useState<Array<{value: string; label: string; icon: string; slotNames: string[]}>>([])  // 已安装社区插件的布局
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // ── 草稿自动保存状态 ──────────────────────────────────────────────────────
  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  // previewKey 변화 → iframe key prop 변화 → React 重建 iframe → 真实服务端页面刷新
  const [previewKey, setPreviewKey] = useState(0)

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewFit, setPreviewFit] = useState<'responsive' | 'scale'>('responsive')

  useEffect(() => {
    Promise.all([
      fetch(`/api/pages/${params.id}`).then(r => r.json()),
      fetch('/api/plugins').then(r => r.json()),
    ]).then(([pageData, pluginsData]) => {
      setPage(pageData)
      setLoading(false)
      // 已安装社区插件 → 追加到布局选择器
      const communityInstalled = (pluginsData.installed || [])
        .filter((p: any) => !p.builtIn && p.layoutOption)
        .map((p: any) => ({
          ...p.layoutOption,
          slotNames: p.slotDefinitions?.map((s: any) => s.name) || [],
        }))
      setExtraLayouts(communityInstalled)
    }).catch(() => setLoading(false))
  }, [params.id])

  // ── ResizeObserver：面板 resize 时通知 iframe 内部 window 重排 ────────────
  // 原理：react-resizable-panels 用 CSS flex 改变面板尺寸，部分浏览器不会自动
  //       把 DOM 尺寸变化传入 iframe 内部 window.resize 事件，需手动 dispatch。
  // 不用 plugin，不用重载 iframe —— 原生 ResizeObserver 足矣。
  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    let rafId: number
    const ro = new ResizeObserver(() => {
      // rAF 避免在同一帧内多次触发
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        try {
          iframeRef.current?.contentWindow?.dispatchEvent(new Event('resize'))
        } catch { /* cross-origin or not yet loaded */ }
        // scale 模式：动态计算 iframe transform
        if (previewFit === 'scale' && iframeRef.current) {
          const cw = container.clientWidth
          const iw = 1200 // 假设页面设计宽度 1200px
          const scale = Math.min(1, cw / iw)
          iframeRef.current.style.transform = `scale(${scale})`
          iframeRef.current.style.transformOrigin = 'top left'
          iframeRef.current.style.width = `${iw}px`
          iframeRef.current.style.height = `${container.clientHeight / scale}px`
        } else if (iframeRef.current) {
          iframeRef.current.style.transform = ''
          iframeRef.current.style.width = '100%'
          iframeRef.current.style.height = '100%'
        }
      })
    })
    ro.observe(container)
    return () => { ro.disconnect(); cancelAnimationFrame(rafId) }
  }, [previewFit])

  // ── 草稿自动保存（防抖 300ms）→ 存完后刷新预览 iframe（真实��务端渲染）───
  function scheduleDraftSave(currentPage: PageData) {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(async () => {
      setDraftSaving(true)
      try {
        await fetch(`/api/pages/${currentPage.id}/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: currentPage.layout, slots: currentPage.slots, layoutConfig: currentPage.layoutConfig }),
        })
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
        // 草稿写入 db.json 后 iframe key+1 → React 重建 iframe → 加载 /pages/slug?preview=1 真实渲染
        setPreviewKey(k => k + 1)
      } catch (e) {
        console.error('草稿保存失败', e)
      }
      setDraftSaving(false)
    }, 300)
  }

  // 监听 page 变化，首次加载不触发
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (page) scheduleDraftSave(page)
  }, [page])

  function findSlotForBlock(blockId: string): string | null {
    if (!page) return null
    for (const [slotName, blocks] of Object.entries(page.slots)) {
      if (blocks.find(b => b.id === blockId)) return slotName
    }
    return null
  }

  function getSelectedBlock(): Block | null {
    if (!page || !selectedId) return null
    for (const blocks of Object.values(page.slots)) {
      const found = blocks.find(b => b.id === selectedId)
      if (found) return found
    }
    return null
  }

  function updateBlockProps(props: Record<string, any>) {
    if (!page || !selectedId) return
    const newSlots = { ...page.slots }
    for (const [slot, blocks] of Object.entries(newSlots)) {
      const idx = blocks.findIndex(b => b.id === selectedId)
      if (idx >= 0) {
        const newBlocks = [...blocks]
        newBlocks[idx] = { ...newBlocks[idx], props }
        newSlots[slot] = newBlocks
      }
    }
    setPage({ ...page, slots: newSlots })
  }

  function updateBlockStyle(style: Partial<import('@/lib/blocks/types').BlockStyle>) {
    if (!page || !selectedId) return
    const newSlots = { ...page.slots }
    for (const [slot, blocks] of Object.entries(newSlots)) {
      const idx = blocks.findIndex(b => b.id === selectedId)
      if (idx >= 0) {
        const newBlocks = [...blocks]
        newBlocks[idx] = { ...newBlocks[idx], style: { ...newBlocks[idx].style, ...style } }
        newSlots[slot] = newBlocks
      }
    }
    setPage({ ...page, slots: newSlots })
  }

  function updateBlockLabel(label: string) {
    if (!page || !selectedId) return
    const newSlots = { ...page.slots }
    for (const [slot, blocks] of Object.entries(newSlots)) {
      const idx = blocks.findIndex(b => b.id === selectedId)
      if (idx >= 0) {
        const newBlocks = [...blocks]
        newBlocks[idx] = { ...newBlocks[idx], label: label || undefined }
        newSlots[slot] = newBlocks
      }
    }
    setPage({ ...page, slots: newSlots })
  }

  function deleteBlock(slotName: string, id: string) {
    if (!page) return
    const newBlocks = page.slots[slotName].filter(b => b.id !== id)
    setPage({ ...page, slots: { ...page.slots, [slotName]: newBlocks } })
    if (selectedId === id) setSelectedId(null)
  }

  function handleLayoutChange(layout: LayoutType) {
    if (!page) return
    const newSlots: Record<string, Block[]> = {}
    ;[...LAYOUT_OPTIONS, ...COMMUNITY_LAYOUT_OPTIONS].find(l => l.value === layout)?.slotNames.forEach(s => { newSlots[s] = page.slots[s] || [] })
    setPage({ ...page, layout, slots: newSlots })
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result

    // 拖到空白区域外：取消
    if (!destination) return
    if (!page) return

    if (source.droppableId === 'palette') {
      // 从积木库拖到画布：在 destination.index 处插入新 block
      if (destination.droppableId === 'palette') return // 拖回积木库，忽略

      const blockType = draggableId.replace('palette-', '')
      const plugin = blockMetaRegistry.get(blockType)
      if (!plugin) return

      const newBlock: Block = {
        id: genId(),
        type: blockType,
        props: { ...plugin.defaultProps },
      }

      const slotName = destination.droppableId.replace('slot-', '')
      const newBlocks = [...(page.slots[slotName] || [])]
      newBlocks.splice(destination.index, 0, newBlock)

      setPage({ ...page, slots: { ...page.slots, [slotName]: newBlocks } })
      setSelectedId(newBlock.id)
    } else {
      // 画布内重排（含跨 slot）
      const srcSlotName = source.droppableId.replace('slot-', '')
      const dstSlotName = destination.droppableId.replace('slot-', '')

      // 同 slot 同位置：无需操作
      if (srcSlotName === dstSlotName && source.index === destination.index) return

      const newSlots = Object.fromEntries(
        Object.entries(page.slots).map(([k, v]) => [k, [...(v as any[])]])
      )

      const [moved] = newSlots[srcSlotName].splice(source.index, 1)
      newSlots[dstSlotName].splice(destination.index, 0, moved)

      setPage({ ...page, slots: newSlots })
    }
  }

  async function save(publish?: boolean) {
    if (!page) return
    setSaving(true)
    const body = publish !== undefined ? { ...page, published: publish } : page
    const res = await fetch(`/api/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setPage(updated)
      setSaveMsg('已保存 ✓')
      setTimeout(() => setSaveMsg(''), 2000)

      // 发布成功后清除草稿
      if (publish !== undefined) {
        try {
          await fetch(`/api/pages/${page.id}/draft`, { method: 'DELETE' })
        } catch (e) {
          console.error('清除草稿失败', e)
        }
      }
    }
    setSaving(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400">加载中…</div>
  if (!page) return <div className="h-screen flex items-center justify-center text-red-400">页面不存在</div>

  // 合并内置布局 + 已安装社区插件布局
  const allLayoutOptions = [...LAYOUT_OPTIONS, ...extraLayouts]

  const selectedBlock = getSelectedBlock()

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">

        {/* ── 顶栏 ── */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 shrink-0 shadow-sm">
          <button
            onClick={() => router.push('/admin/pages')}
            className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1 shrink-0"
          >
            ← 返回
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 标题 */}
          <input
            value={page.title}
            onChange={e => setPage({ ...page, title: e.target.value })}
            className="font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-indigo-400 px-1 min-w-0 w-36"
            placeholder="页面标题"
          />

          {/* Slug */}
          <span className="text-gray-300 shrink-0 text-sm">/pages/</span>
          <input
            value={page.slug}
            onChange={e => setPage({ ...page, slug: e.target.value.replace(/[^a-z0-9-]/g, '-') })}
            className="text-gray-600 bg-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-28"
            placeholder="url-slug"
          />

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* 骨架选择 */}
          <div className="flex items-center gap-1 shrink-0">
            {allLayoutOptions.map(l => (
              <button
                key={l.value}
                onClick={() => handleLayoutChange(l.value as LayoutType)}
                title={l.label}
                className={`px-2 py-1.5 text-xs rounded-lg border transition ${
                  page.layout === l.value
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <span className="mr-1">{l.icon}</span>{l.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* 设备切换 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
            {([
              { key: 'desktop', icon: '🖥', label: '桌面' },
              { key: 'tablet', icon: '📱', label: '平板' },
              { key: 'mobile', icon: '📲', label: '手机' },
            ] as const).map(d => (
              <button
                key={d.key}
                onClick={() => setDevice(d.key)}
                title={d.label}
                className={`px-2 py-1 text-sm rounded transition ${device === d.key ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {d.icon}
              </button>
            ))}
          </div>

          {/* 草稿状态 */}
          <span className="text-xs text-gray-400 shrink-0">
            {draftSaving ? '⏳ 草稿保存中…' : draftSaved ? '草稿 ✓' : ''}
          </span>

          {/* 全屏预览（保留，打开已保存页面） */}
          <a
            href={`/pages/${page.slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 transition shrink-0"
          >
            ↗ 全屏预览
          </a>

          {saveMsg && <span className="text-green-500 text-sm shrink-0">{saveMsg}</span>}

          <button
            onClick={() => save()}
            disabled={saving}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 shrink-0"
          >
            {saving ? '保存中…' : '保存'}
          </button>
          <button
            onClick={() => save(!page.published)}
            disabled={saving}
            className={`px-4 py-1.5 text-sm rounded-lg transition disabled:opacity-50 shrink-0 font-medium
              ${page.published ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {page.published ? '取消发布' : '发布'}
          </button>
        </div>

        {/* ── 三栏主体：react-resizable-panels（正确 v4 API）── */}
        <Group orientation="horizontal" className="flex-1 overflow-hidden">

          {/* 左栏：积木库 — defaultSize 必须用字符串表示百分比 */}
          <Panel defaultSize="18%" minSize="160px" maxSize="320px">
            <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                <div className="text-sm font-semibold text-gray-700">积木库</div>
                <div className="text-xs text-gray-400 mt-0.5">拖动积木到画布</div>
              </div>
              <BlockLibrary />
            </div>
          </Panel>

          <Separator className="w-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-col-resize transition-colors" />

          {/* 中栏：画布 */}
          <Panel defaultSize="57%" minSize="320px">
            <div className="h-full bg-gray-100 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
                <span className="text-xs text-gray-400 font-mono flex-1">/pages/{page.slug}</span>
                <a href={`/pages/${page.slug}`} target="_blank"
                  className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition">
                  在新标签打开 ↗
                </a>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <CanvasArea
                  page={page}
                  selectedId={selectedId}
                  onSelect={id => setSelectedId(id)}
                  onDelete={(slot, id) => deleteBlock(slot, id)}
                  device={device}
                />
              </div>
            </div>
          </Panel>

          <Separator className="w-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-col-resize transition-colors" />

          {/* 右栏：上=配置 下=实时预览，垂直 react-resizable-panels，无需 Tab 切换 */}
          <Panel defaultSize="25%" minSize="220px" maxSize="480px">
            <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
              <Group orientation="vertical" className="flex-1 overflow-hidden">

                {/* 上：配置面板 */}
                <Panel defaultSize="55%" minSize="120px">
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 shrink-0 flex items-center gap-1.5">
                      <span className="text-xs">⚙️</span>
                      <span className="text-xs font-semibold text-gray-600">配置</span>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      {selectedBlock ? (
                        <ConfigPanel
                          block={selectedBlock}
                          onUpdate={props => updateBlockProps(props)}
                          onUpdateStyle={style => updateBlockStyle(style)}
                          onUpdateLabel={label => updateBlockLabel(label)}
                          onDelete={() => { const slot = findSlotForBlock(selectedId!); if (slot && selectedId) deleteBlock(slot, selectedId) }}
                          onClose={() => setSelectedId(null)}
                        />
                      ) : (
                        <div className="flex flex-col h-full">
                          <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">页面标题</label>
                              <input value={page.title} onChange={e => setPage({ ...page, title: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">URL Slug</label>
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">/pages/</span>
                                <input value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value.replace(/[^a-z0-9-]/g, '-') })}
                                  className="flex-1 px-2 py-2 text-sm outline-none" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">当前骨架</label>
                              <div className="text-sm text-gray-700 font-medium">{allLayoutOptions.find(l => l.value === page.layout)?.label || page.layout}</div>
                            </div>
                            {/* Gutter 间距控制 */}
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                                插槽间距 <span className="text-indigo-500 font-semibold">{page.layoutConfig?.gutter ?? 24}px</span>
                              </label>
                              <input
                                type="range" min={0} max={80} step={4}
                                value={page.layoutConfig?.gutter ?? 24}
                                onChange={e => setPage(p => p ? { ...p, layoutConfig: { ...(p.layoutConfig || {}), gutter: Number(e.target.value) } } : p)}
                                className="w-full accent-indigo-500"
                              />
                              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                                <span>无</span><span>紧凑</span><span>默认</span><span>宽松</span>
                              </div>
                            </div>
                            {/* Padding 内边距控制 */}
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                                容器内边距 <span className="text-indigo-500 font-semibold">{page.layoutConfig?.padding ?? 32}px</span>
                              </label>
                              <input
                                type="range" min={0} max={96} step={8}
                                value={page.layoutConfig?.padding ?? 32}
                                onChange={e => setPage(p => p ? { ...p, layoutConfig: { ...(p.layoutConfig || {}), padding: Number(e.target.value) } } : p)}
                                className="w-full accent-indigo-500"
                              />
                              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                                <span>无</span><span>小</span><span>中</span><span>大</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">发布状态</label>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {page.published ? '● 已发布' : '○ 草稿'}
                              </span>
                            </div>
                          </div>
                          <div className="px-4 pb-3 shrink-0 text-xs text-gray-400 text-center">点击画布中的组件以编辑配置</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>

                {/* 垂直分隔线，可拖动 */}
                <Separator className="h-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-row-resize transition-colors" />

                {/* 下：实时预览 iframe（真实服务端渲染） */}
                <Panel defaultSize="45%" minSize="120px">
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 shrink-0 flex items-center gap-1.5">
                      <span className="text-xs">👁</span>
                      <span className="text-xs font-semibold text-gray-600">实时预览</span>
                      {draftSaving && <span className="text-xs text-amber-500">保存中…</span>}
                      {!draftSaving && draftSaved && <span className="text-xs text-green-500">已更新 ✓</span>}
                      {/* 预览模式切换 */}
                      <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button
                          onClick={() => setPreviewFit('responsive')}
                          title="响应式：iframe 以面板实际宽度渲染，模拟窄屏效果"
                          className={`px-2 py-0.5 rounded-md text-xs transition ${previewFit === 'responsive' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >响应式</button>
                        <button
                          onClick={() => setPreviewFit('scale')}
                          title="缩放适配：以 1200px 全宽渲染后等比缩小，所见即桌面效果"
                          className={`px-2 py-0.5 rounded-md text-xs transition ${previewFit === 'scale' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >缩放</button>
                      </div>
                    </div>
                    {/* 容器 ref 供 ResizeObserver 监听；overflow-hidden 防止 scale 模式溢出 */}
                    <div ref={previewContainerRef} className="flex-1 overflow-hidden relative bg-gray-50">
                      <iframe
                        ref={iframeRef}
                        key={previewKey}
                        src={`/pages/${page.slug}?preview=1`}
                        className="border-0 bg-white"
                        style={{ width: '100%', height: '100%' }}
                        title="实时预览"
                      />
                    </div>
                  </div>
                </Panel>

              </Group>
            </div>
          </Panel>

        </Group>
      </div>
    </DragDropContext>
  )
}
