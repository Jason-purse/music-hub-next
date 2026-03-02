'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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

function getDefaultChildren(type: string): Record<string, Block[]> | undefined {
  const layouts: Record<string, Record<string, Block[]>> = {
    'layout-container': { default: [] },
    'layout-flex':      { default: [] },
    'layout-grid':      { default: [] },
    'layout-columns':   { col1: [], col2: [] },
    'layout-stack':     { background: [], foreground: [] },
    'layout-card':      { default: [] },
  }
  return layouts[type]
}

function findBlockInSlots(slots: Record<string, Block[]>, id: string): Block | null {
  for (const blocks of Object.values(slots)) {
    for (const block of blocks) {
      if (block.id === id) return block
      if (block.children) {
        const found = findBlockInSlots(block.children, id)
        if (found) return found
      }
    }
  }
  return null
}

function removeBlockFromSlots(slots: Record<string, Block[]>, id: string): Record<string, Block[]> {
  const result: Record<string, Block[]> = {}
  for (const [key, blocks] of Object.entries(slots)) {
    result[key] = blocks
      .filter(b => b.id !== id)
      .map(b => b.children ? { ...b, children: removeBlockFromSlots(b.children, id) } : b)
  }
  return result
}

function insertBlockIntoSlots(
  slots: Record<string, Block[]>,
  parentId: string,
  slotName: string,
  index: number,
  newBlock: Block,
): Record<string, Block[]> {
  const result: Record<string, Block[]> = {}
  for (const [key, blocks] of Object.entries(slots)) {
    result[key] = blocks.map(b => {
      if (b.id === parentId && b.children) {
        const updatedChildren = { ...b.children }
        const arr = [...(updatedChildren[slotName] || [])]
        arr.splice(index, 0, newBlock)
        updatedChildren[slotName] = arr
        return { ...b, children: updatedChildren }
      }
      if (b.children) {
        return { ...b, children: insertBlockIntoSlots(b.children, parentId, slotName, index, newBlock) }
      }
      return b
    })
  }
  return result
}

function updateBlockInSlots(
  slots: Record<string, Block[]>,
  id: string,
  updater: (b: Block) => Block,
): Record<string, Block[]> {
  const result: Record<string, Block[]> = {}
  for (const [key, blocks] of Object.entries(slots)) {
    result[key] = blocks.map(b => {
      if (b.id === id) return updater(b)
      if (b.children) return { ...b, children: updateBlockInSlots(b.children, id, updater) }
      return b
    })
  }
  return result
}

function findSlotContainingBlock(slots: Record<string, Block[]>, blockId: string): { parentId: string | null; slotName: string; index: number } | null {
  for (const [slotName, blocks] of Object.entries(slots)) {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].id === blockId) return { parentId: null, slotName, index: i }
      if (blocks[i].children) {
        const found = findSlotContainingBlockInChildren(blocks[i].children!, blockId, blocks[i].id)
        if (found) return found
      }
    }
  }
  return null
}

function findSlotContainingBlockInChildren(children: Record<string, Block[]>, blockId: string, parentId: string): { parentId: string; slotName: string; index: number } | null {
  for (const [slotName, blocks] of Object.entries(children)) {
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].id === blockId) return { parentId, slotName, index: i }
      if (blocks[i].children) {
        const found = findSlotContainingBlockInChildren(blocks[i].children!, blockId, blocks[i].id)
        if (found) return found
      }
    }
  }
  return null
}

// ─── 客户端预览面板 ─────────────────────────────────────────────────────────

function ClientPreviewPanel({ page, device }: { page: PageData; device: 'desktop' | 'tablet' | 'mobile' }) {
  const deviceWidths = { desktop: '100%', tablet: '768px', mobile: '375px' }
  const width = deviceWidths[device]
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
      <div className="text-xs text-gray-400 mb-2">
        {device === 'mobile' ? '📱 375px' : device === 'tablet' ? '💻 768px' : '🖥️ 全宽'}
      </div>
      <div className="bg-white shadow-lg rounded-xl overflow-hidden transition-all duration-300" style={{ width, maxWidth: '100%', minHeight: 400 }}>
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded-md" />
          <span className="font-semibold text-sm text-gray-800">MusicHub</span>
          <div className="ml-auto flex gap-1">
            <div className="w-12 h-2 bg-gray-200 rounded" />
            <div className="w-12 h-2 bg-gray-200 rounded" />
          </div>
        </div>
        <div className={lc.cols > 1 ? `grid grid-cols-${lc.cols} gap-0` : 'block'}>
          {lc.slots.map(slotName => {
            const blocks = page.slots[slotName] || []
            return (
              <div key={slotName} className={slotName === 'main' || slotName === 'hero' ? 'col-span-1' : ''}>
                {blocks.length === 0 ? (
                  <div className="p-4 text-center text-gray-300 text-xs border border-dashed border-gray-200 m-2 rounded-lg">{slotName} 区域（空）</div>
                ) : (
                  blocks.map(block => {
                    const meta = blockMetaRegistry.get(block.type)
                    if (!meta?.Preview) return null
                    return <div key={block.id} className="pointer-events-none"><meta.Preview props={block.props} /></div>
                  })
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        实时预览（无需保存）
      </div>
    </div>
  )
}

// ─── 数据源选择组件 ────────────────────────────────────────────────────────────

function DataSourceSelect({ value, onChange, label, description }: {
  value: string; onChange: (v: string) => void; label: string; description?: string
}) {
  const { data } = useSWR('/api/datasources', (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false })
  const sources = data?.datasources || []
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-1">{description}</p>}
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300">
        <option value="">默认（内置数据）</option>
        {sources.map((ds: any) => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
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
    <DataSourceSelect value={value || ''} onChange={onChange} label={field.label} description={field.description} />
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
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            节点名称<span className="ml-1 text-gray-300 font-normal">（用于时间轴目录、画布标识）</span>
          </label>
          <input type="text" value={block.label || ''} onChange={e => onUpdateLabel(e.target.value)}
            placeholder={`默认：${plugin.label}`}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
        </div>
        <div className="border-t border-gray-100" />
        {plugin.fields.map(field => (
          <div key={field.name}>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{field.label}</label>
            <FieldInput field={field}
              value={block.props[field.name] ?? (field as any).defaultValue ?? plugin.defaultProps[field.name]}
              onChange={v => onUpdate({ ...block.props, [field.name]: v })} />
          </div>
        ))}
        <div className="border-t border-gray-100 pt-3">
          <button onClick={() => setStyleOpen(o => !o)}
            className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-700 transition">
            <span>🎨 外观样式</span>
            <span className="text-gray-300">{styleOpen ? '▲' : '▼'}</span>
          </button>
          {styleOpen && (
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">上边距 <span className="text-indigo-500">{s.marginTop ?? 0}px</span></label>
                  <input type="range" min={0} max={120} step={4} value={s.marginTop ?? 0}
                    onChange={e => onUpdateStyle({ marginTop: Number(e.target.value) })} className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">下边距 <span className="text-indigo-500">{s.marginBottom ?? 0}px</span></label>
                  <input type="range" min={0} max={120} step={4} value={s.marginBottom ?? 0}
                    onChange={e => onUpdateStyle({ marginBottom: Number(e.target.value) })} className="w-full accent-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">横向内边距 <span className="text-indigo-500">{s.paddingX ?? 0}px</span></label>
                  <input type="range" min={0} max={64} step={4} value={s.paddingX ?? 0}
                    onChange={e => onUpdateStyle({ paddingX: Number(e.target.value) })} className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">纵向内边距 <span className="text-indigo-500">{s.paddingY ?? 0}px</span></label>
                  <input type="range" min={0} max={64} step={4} value={s.paddingY ?? 0}
                    onChange={e => onUpdateStyle({ paddingY: Number(e.target.value) })} className="w-full accent-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">背景色</label>
                <div className="flex gap-2 flex-wrap">
                  {['transparent','#ffffff','#f9fafb','#eff6ff','#fdf4ff','#f0fdf4','#fff7ed','#1f2937'].map(c => (
                    <button key={c} onClick={() => onUpdateStyle({ bgColor: c })} title={c}
                      className="w-7 h-7 rounded-lg border-2 transition"
                      style={{
                        background: c === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px' : c,
                        borderColor: s.bgColor === c ? '#6366f1' : '#e5e7eb',
                      }} />
                  ))}
                  <input type="color" value={s.bgColor && s.bgColor !== 'transparent' ? s.bgColor : '#ffffff'}
                    onChange={e => onUpdateStyle({ bgColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5" title="自定义颜色" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">圆角 <span className="text-indigo-500">{s.borderRadius ?? 0}px</span></label>
                  <input type="range" min={0} max={32} step={2} value={s.borderRadius ?? 0}
                    onChange={e => onUpdateStyle({ borderRadius: Number(e.target.value) })} className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">阴影</label>
                  <div className="flex gap-1.5">
                    {(['none','sm','md','lg'] as const).map(sh => (
                      <button key={sh} onClick={() => onUpdateStyle({ shadow: sh })}
                        className={`flex-1 py-1 text-xs rounded-lg border transition ${s.shadow === sh || (!s.shadow && sh === 'none') ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        {sh === 'none' ? '无' : sh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => onUpdateStyle({ marginTop: 0, marginBottom: 0, paddingX: 0, paddingY: 0, bgColor: 'transparent', borderRadius: 0, shadow: 'none' })}
                className="text-xs text-gray-400 hover:text-gray-600 underline">重置外观</button>
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

const SLOT_LABELS: Record<string, string> = {
  main: '主区域', sidebar: '侧边栏', hero: 'Hero 区', content: '内容区',
  left: '左栏', right: '右栏', col1: '第一列', col2: '第二列', col3: '第三列',
}

interface PluginBlockItem {
  type: string; label: string; icon: string; description?: string
  category?: string; component: string; defaultProps?: Record<string, unknown>
  pluginId: string; pluginName: string
}

type UnifiedBlock = { type: string; label: string; icon: string; tag: string; isPlugin: boolean; pluginName?: string }

// Palette draggable card
function PaletteBlockCard({ block }: { block: UnifiedBlock }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.type}`,
    data: { type: 'palette', blockType: block.type },
  })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 9999, position: 'relative' as const } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition select-none text-center relative [&:last-child:nth-child(odd)]:col-span-2
        ${isDragging
          ? 'opacity-60 border-indigo-300 bg-indigo-50'
          : block.isPlugin
            ? 'border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:bg-purple-50/60'
            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
        }`}>
      <span className="text-2xl">{block.icon}</span>
      <div className="text-xs font-medium text-gray-700 leading-tight">{block.label}</div>
      {block.isPlugin && <div className="text-[9px] text-purple-400 truncate w-full">{block.pluginName}</div>}
    </div>
  )
}

function BlockLibrary() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('all')
  const [pluginBlocks, setPluginBlocks] = useState<PluginBlockItem[]>([])
  const [pluginBlocksLoading, setPluginBlocksLoading] = useState(true)

  const BUILTIN_TAG_MAP: Record<string, string[]> = {
    'structure':   ['hero-banner'],
    'music':       ['chart-list', 'decade-stack', 'playlist-grid'],
    'data':        ['stats-card'],
    'interaction': ['search-bar'],
    'layout':      ['spacer', 'layout-container', 'layout-flex', 'layout-grid', 'layout-columns', 'layout-stack', 'layout-card'],
  }
  const TAG_LABELS: Record<string, string> = {
    all: '全部', structure: '🏗 结构', music: '🎵 音乐', data: '📊 数据',
    interaction: '🔍 交互', layout: '📐 布局', navigation: '🧭 导航', plugin: '⚡ 扩展',
  }

  useEffect(() => {
    fetch('/api/plugins/blocks').then(r => r.json())
      .then(data => setPluginBlocks(data.blocks ?? []))
      .catch(() => setPluginBlocks([]))
      .finally(() => setPluginBlocksLoading(false))
  }, [])

  const allBlocks = React.useMemo<UnifiedBlock[]>(() => {
    const result: UnifiedBlock[] = []
    for (const [tag, types] of Object.entries(BUILTIN_TAG_MAP)) {
      for (const type of types) {
        const meta = blockMetaRegistry.get(type)
        if (meta) result.push({ type: meta.type, label: meta.label, icon: meta.icon, tag, isPlugin: false })
      }
    }
    for (const b of pluginBlocks) {
      result.push({ type: b.type, label: b.label, icon: b.icon, tag: b.category ?? 'plugin', isPlugin: true, pluginName: b.pluginName })
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginBlocks])

  const availableTags = React.useMemo(() => {
    const tags = ['all', ...Object.keys(BUILTIN_TAG_MAP)]
    const pluginCategories = Array.from(new Set(pluginBlocks.map(b => b.category).filter(Boolean))) as string[]
    pluginCategories.forEach(c => { if (!tags.includes(c)) tags.push(c) })
    if (pluginBlocks.length > 0) tags.push('plugin')
    return tags
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginBlocks])

  const q = search.trim().toLowerCase()
  const filteredBlocks = React.useMemo<UnifiedBlock[]>(() => {
    return allBlocks.filter(b => {
      const matchSearch = !q || b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || (b.pluginName?.toLowerCase().includes(q) ?? false)
      const matchTag = activeTag === 'all' ? true : activeTag === 'plugin' ? b.isPlugin : b.tag === activeTag
      return matchSearch && matchTag
    })
  }, [allBlocks, q, activeTag])

  const countForTag = React.useCallback((tag: string) => {
    return allBlocks.filter(b => {
      const matchSearch = !q || b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q) || (b.pluginName?.toLowerCase().includes(q) ?? false)
      const matchTag = tag === 'all' ? true : tag === 'plugin' ? b.isPlugin : b.tag === tag
      return matchSearch && matchTag
    }).length
  }, [allBlocks, q])

  const FlatGrid = ({ blocks }: { blocks: UnifiedBlock[] }) => (
    <div className="grid grid-cols-2 gap-1.5">
      {blocks.map(block => <PaletteBlockCard key={block.type} block={block} />)}
    </div>
  )

  const GroupedView = ({ blocks }: { blocks: UnifiedBlock[] }) => {
    const sections: Array<{ tagId: string; label: string; items: UnifiedBlock[] }> = []
    for (const tagId of Object.keys(BUILTIN_TAG_MAP)) {
      const items = blocks.filter(b => !b.isPlugin && b.tag === tagId)
      if (items.length > 0) sections.push({ tagId, label: TAG_LABELS[tagId] ?? tagId, items })
    }
    const pluginGroupMap = new Map<string, UnifiedBlock[]>()
    for (const b of blocks.filter(b => b.isPlugin)) {
      const name = b.pluginName ?? '未知插件'
      if (!pluginGroupMap.has(name)) pluginGroupMap.set(name, [])
      pluginGroupMap.get(name)!.push(b)
    }
    return (
      <div className="space-y-4 mt-2">
        {sections.map(sec => (
          <div key={sec.tagId}>
            <div className="mb-2 text-xs font-semibold text-gray-500">{sec.label}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {sec.items.map(block => <PaletteBlockCard key={block.type} block={block} />)}
            </div>
          </div>
        ))}
        {pluginGroupMap.size > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-purple-500">⚡ 扩展积木</div>
            <div className="space-y-3">
              {Array.from(pluginGroupMap.entries()).map(([pluginName, items]) => (
                <div key={pluginName}>
                  <div className="mb-1.5 text-[10px] text-purple-400">🧩 {pluginName}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map(block => <PaletteBlockCard key={block.type} block={block} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const EmptyState = ({ search: s, activeTag: tag }: { search: string; activeTag: string }) => {
    if (tag === 'plugin' && pluginBlocks.length === 0 && !s) {
      return (
        <div className="border border-dashed border-purple-200 rounded-xl p-4 text-center mt-2">
          <div className="text-2xl mb-2">🧩</div>
          <div className="text-sm font-medium text-purple-600">安装插件后，插件提供的积木将出现在这里</div>
          <Link href="/admin/plugins" className="mt-3 inline-block text-xs text-purple-500 hover:underline">前往插件市场 →</Link>
        </div>
      )
    }
    return <div className="text-xs text-gray-400 text-center py-6">{s ? `未找到「${s}」相关积木` : '暂无积木'}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="px-3 pt-3 shrink-0">
        <div className="relative">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索积木…"
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-indigo-300 focus:outline-none transition placeholder:text-gray-300" />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm leading-none">✕</button>
          )}
        </div>
      </div>
      <div className="px-3 pt-2 pb-0.5 shrink-0 min-w-0">
        <div className="flex flex-wrap gap-1.5 pb-0.5">
          {availableTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium transition ${activeTag === tag ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {TAG_LABELS[tag] ?? tag}
              <span className="ml-1 text-[10px] opacity-60">({countForTag(tag)})</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {pluginBlocksLoading && activeTag === 'plugin' ? (
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse flex flex-col items-center gap-1 p-2.5 rounded-xl border border-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded" /><div className="h-2.5 bg-purple-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredBlocks.length === 0 ? (
          <EmptyState search={search} activeTag={activeTag} />
        ) : activeTag === 'all' && !search ? (
          <GroupedView blocks={filteredBlocks} />
        ) : (
          <div className="mt-2"><FlatGrid blocks={filteredBlocks} /></div>
        )}
      </div>
    </div>
  )
}

// ─── 单个 Block 预览 ─────────────────────────────────────────────────────────

function BlockPreviewWrapper({ block }: { block: Block }) {
  const plugin = blockMetaRegistry.get(block.type)
  if (!plugin) return <div className="h-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">未知组件</div>
  return <plugin.Preview props={block.props} />
}

// ─── SortableCanvasBlock ─────────────────────────────────────────────────────

function SortableCanvasBlock({
  block, selectedId, onSelect, onDelete,
}: {
  block: Block; selectedId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { type: 'canvas-block', blockId: block.id },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}
      className={`rounded-xl overflow-hidden border-2 transition-all mb-2
        ${selectedId === block.id ? 'border-indigo-500 shadow-md shadow-indigo-100' : 'border-transparent hover:border-indigo-200'}
        ${isDragging ? 'shadow-2xl rotate-1' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id) }}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-b border-gray-100" {...attributes} {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
        <span className="text-xs text-gray-500">
          {block.label
            ? <><span className="text-indigo-400">{block.label}</span><span className="text-gray-300 ml-1">· {blockMetaRegistry.get(block.type)?.label}</span></>
            : blockMetaRegistry.get(block.type)?.label}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(block.id) }}
          className="ml-auto text-gray-300 hover:text-red-400 text-xs px-1">✕</button>
      </div>
      <div className={block.children ? '' : 'pointer-events-none'}>
        <CanvasBlock block={block} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} />
      </div>
    </div>
  )
}

// ─── NestedSlot（布局块内部 droppable） ──────────────────────────────────────

function NestedSlot({
  parentId, slotName, children, selectedId, onSelect, onDelete,
}: {
  parentId: string; slotName: string; children: Block[]
  selectedId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void
}) {
  const droppableId = `child::${parentId}::${slotName}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })
  return (
    <SortableContext items={children.map(b => b.id)} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef}
        className={`min-h-[60px] flex-1 rounded border border-dashed p-1 transition
          ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-300 bg-gray-50/50'}`}>
        <div className="text-[10px] text-gray-400 text-center mb-1">{slotName}</div>
        {children.map(child => (
          <SortableCanvasBlock key={child.id} block={child} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} />
        ))}
        {children.length === 0 && !isOver && (
          <div className="flex items-center justify-center py-3 text-xs text-gray-300">拖入积木</div>
        )}
      </div>
    </SortableContext>
  )
}

// ─── CanvasBlock ─────────────────────────────────────────────────────────────

function CanvasBlock({
  block, selectedId, onSelect, onDelete,
}: {
  block: Block; selectedId: string | null; onSelect: (id: string) => void; onDelete: (id: string) => void
}) {
  if (!block.children) return <BlockPreviewWrapper block={block} />

  const LAYOUT_COLORS: Record<string, { border: string; bg: string; text: string; label: string }> = {
    'layout-container': { border: 'border-blue-300', bg: 'bg-blue-50/20', text: 'text-blue-500', label: '📦 容器' },
    'layout-flex':      { border: 'border-sky-300', bg: 'bg-sky-50/20', text: 'text-sky-500', label: '⬜ 弹性' },
    'layout-grid':      { border: 'border-green-300', bg: 'bg-green-50/20', text: 'text-green-600', label: '🔳 网格' },
    'layout-columns':   { border: 'border-amber-300', bg: 'bg-amber-50/20', text: 'text-amber-600', label: '📑 分栏' },
    'layout-stack':     { border: 'border-purple-300', bg: 'bg-purple-50/20', text: 'text-purple-600', label: '🔲 层叠' },
    'layout-card':      { border: 'border-gray-300', bg: 'bg-white', text: 'text-gray-600', label: '🃏 卡片' },
  }
  const colors = LAYOUT_COLORS[block.type] || { border: 'border-indigo-300', bg: 'bg-indigo-50/20', text: 'text-indigo-500', label: '📦 容器' }
  const isHorizontal = block.type === 'layout-columns' || (block.type === 'layout-flex' && block.props.direction !== 'column')

  return (
    <div className={`border-2 border-dashed ${colors.border} rounded-lg p-2 ${colors.bg}`}>
      <div className={`text-xs ${colors.text} font-medium mb-2 flex items-center gap-1`}>
        <span>{colors.label}</span>
        {block.label && <span className="text-gray-400">· {block.label}</span>}
      </div>
      <div className={isHorizontal ? 'flex gap-2' : 'flex flex-col gap-2'}>
        {Object.entries(block.children).map(([slotName, childBlocks]) => (
          <NestedSlot key={slotName} parentId={block.id} slotName={slotName}
            children={childBlocks} selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

// ─── Canvas Slot（顶层 droppable） ───────────────────────────────────────────

function CanvasSlot({
  slotName, blocks, selectedId, onSelect, onDelete,
}: {
  slotName: string; blocks: Block[]; selectedId: string | null
  onSelect: (id: string) => void; onDelete: (slotName: string, id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotName}` })
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{SLOT_LABELS[slotName] || slotName}</span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-300">{blocks.length} 个组件</span>
      </div>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef}
          className={`min-h-[80px] flex flex-col gap-2 p-2 rounded-2xl border-2 border-dashed transition-colors
            ${isOver ? 'border-indigo-400 bg-indigo-50/60' : blocks.length === 0 ? 'border-gray-200 bg-gray-50/60' : 'border-gray-100 bg-transparent'}`}>
          {blocks.length === 0 && !isOver && (
            <div className="flex-1 flex items-center justify-center py-6 text-sm text-gray-300">将积木拖到此处</div>
          )}
          {blocks.map(block => (
            <SortableCanvasBlock key={block.id} block={block} selectedId={selectedId}
              onSelect={onSelect} onDelete={(id) => onDelete(slotName, id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── 三端并排预览 ─────────────────────────────────────────────────────────────

const DEVICES = [
  { label: '桌面', deviceIcon: '🖥', width: 1280 },
  { label: '平板', deviceIcon: '📱', width: 768 },
  { label: '手机', deviceIcon: '📲', width: 390 },
] as const

type DeviceItem = typeof DEVICES[number]

function DeviceFrame({ device, url, containerHeight, scale }: {
  device: DeviceItem; url: string; containerHeight: number; scale: number
}) {
  const iframeHeight = containerHeight / scale
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-400 text-center">{device.deviceIcon} {device.label}·{device.width}px</div>
      <div style={{ width: device.width * scale, height: containerHeight, overflow: 'hidden', position: 'relative', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <iframe src={url} style={{ width: device.width, height: iframeHeight, border: 'none', transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }} title={`${device.deviceIcon} ${device.label} 预览`} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, cursor: 'default' }} onClickCapture={e => e.preventDefault()} />
      </div>
    </div>
  )
}

// ─── 画布容器 ────────────────────────────────────────────────────────────────

function CanvasArea({ page, selectedId, onSelect, onDelete, device }: {
  page: PageData; selectedId: string | null; onSelect: (id: string) => void
  onDelete: (slotName: string, id: string) => void; device: 'desktop' | 'tablet' | 'mobile'
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
            <CanvasSlot key={slotName} slotName={slotName} blocks={page.slots[slotName] || []}
              selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {slotNames.map(slotName => (
            <CanvasSlot key={slotName} slotName={slotName} blocks={page.slots[slotName] || []}
              selectedId={selectedId} onSelect={onSelect} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 主编辑器 ─────────────────────────────────────────────────────────────────

export default function PageEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [extraLayouts, setExtraLayouts] = useState<Array<{value: string; label: string; icon: string; slotNames: string[]}>>([])
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [multiPreviewOpen, setMultiPreviewOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440)

  const [draftSaving, setDraftSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewFit, setPreviewFit] = useState<'responsive' | 'scale'>('responsive')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch(`/api/pages/${params.id}`).then(r => r.json()),
      fetch('/api/plugins').then(r => r.json()),
    ]).then(([pageData, pluginsData]) => {
      setPage({ ...pageData, slots: pageData.slots ?? {}, layout: pageData.layout ?? 'single-col' })
      setLoading(false)
      const communityInstalled = (pluginsData.installed || [])
        .filter((p: any) => !p.builtIn && p.layoutOption)
        .map((p: any) => ({ ...p.layoutOption, slotNames: p.slotDefinitions?.map((s: any) => s.name) || [] }))
      setExtraLayouts(communityInstalled)
    }).catch(() => setLoading(false))
  }, [params.id])

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return
    let rafId: number
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        try { iframeRef.current?.contentWindow?.dispatchEvent(new Event('resize')) } catch {}
        if (previewFit === 'scale' && iframeRef.current) {
          const cw = container.clientWidth
          const iw = 1200
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
        setPreviewKey(k => k + 1)
      } catch (e) { console.error('草稿保存失败', e) }
      setDraftSaving(false)
    }, 300)
  }

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (page) scheduleDraftSave(page)
  }, [page])

  function findSlotForBlock(blockId: string): string | null {
    if (!page) return null
    for (const [slotName, blocks] of Object.entries(page.slots)) {
      if (blocks.find(b => b.id === blockId)) return slotName
    }
    const loc = findSlotContainingBlock(page.slots, blockId)
    return loc ? loc.slotName : null
  }

  function getSelectedBlock(): Block | null {
    if (!page || !selectedId) return null
    return findBlockInSlots(page.slots, selectedId)
  }

  function updateBlockProps(props: Record<string, any>) {
    if (!page || !selectedId) return
    setPage({ ...page, slots: updateBlockInSlots(page.slots, selectedId, b => ({ ...b, props })) })
  }

  function updateBlockStyle(style: Partial<import('@/lib/blocks/types').BlockStyle>) {
    if (!page || !selectedId) return
    setPage({ ...page, slots: updateBlockInSlots(page.slots, selectedId, b => ({ ...b, style: { ...b.style, ...style } })) })
  }

  function updateBlockLabel(label: string) {
    if (!page || !selectedId) return
    setPage({ ...page, slots: updateBlockInSlots(page.slots, selectedId, b => ({ ...b, label: label || undefined })) })
  }

  function deleteBlock(slotName: string, id: string) {
    if (!page) return
    setPage({ ...page, slots: removeBlockFromSlots(page.slots, id) })
    if (selectedId === id) setSelectedId(null)
  }

  function handleLayoutChange(layout: LayoutType) {
    if (!page) return
    const newSlots: Record<string, Block[]> = {}
    ;[...LAYOUT_OPTIONS, ...COMMUNITY_LAYOUT_OPTIONS].find(l => l.value === layout)?.slotNames.forEach(s => { newSlots[s] = page.slots[s] || [] })
    setPage({ ...page, layout, slots: newSlots })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !page) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Case 1: 从 palette 拖入
    if (activeId.startsWith('palette-')) {
      const blockType = activeId.replace('palette-', '')
      const plugin = blockMetaRegistry.get(blockType)
      if (!plugin) return
      const newBlock: Block = {
        id: genId(),
        type: blockType,
        props: { ...plugin.defaultProps },
        children: getDefaultChildren(blockType),
      }
      if (overId.startsWith('child::')) {
        const [, parentId, slotName] = overId.split('::')
        setPage({ ...page, slots: insertBlockIntoSlots(page.slots, parentId, slotName, Infinity, newBlock) })
      } else if (overId.startsWith('slot-')) {
        const slotName = overId.replace('slot-', '')
        const newBlocks = [...(page.slots[slotName] || []), newBlock]
        setPage({ ...page, slots: { ...page.slots, [slotName]: newBlocks } })
      } else {
        // overId is a block id: find which slot it belongs to and append there
        const loc = findSlotContainingBlock(page.slots, overId)
        if (loc) {
          if (loc.parentId) {
            setPage({ ...page, slots: insertBlockIntoSlots(page.slots, loc.parentId, loc.slotName, loc.index + 1, newBlock) })
          } else {
            const arr = [...(page.slots[loc.slotName] || [])]
            arr.splice(loc.index + 1, 0, newBlock)
            setPage({ ...page, slots: { ...page.slots, [loc.slotName]: arr } })
          }
        }
      }
      setSelectedId(newBlock.id)
      return
    }

    // Case 2: canvas block 重排
    const movedBlock = findBlockInSlots(page.slots, activeId)
    if (!movedBlock) return

    if (overId.startsWith('child::')) {
      const [, parentId, slotName] = overId.split('::')
      setPage(prev => {
        if (!prev) return prev
        const block = findBlockInSlots(prev.slots, activeId)
        if (!block) return prev
        let updated = removeBlockFromSlots(prev.slots, activeId)
        updated = insertBlockIntoSlots(updated, parentId, slotName, Infinity, block)
        return { ...prev, slots: updated }
      })
    } else if (overId.startsWith('slot-')) {
      const slotName = overId.replace('slot-', '')
      setPage(prev => {
        if (!prev) return prev
        const block = findBlockInSlots(prev.slots, activeId)
        if (!block) return prev
        let updated = removeBlockFromSlots(prev.slots, activeId)
        const arr = [...(updated[slotName] || []), block]
        updated[slotName] = arr
        return { ...prev, slots: updated }
      })
    } else {
      // overId is another block id — find it and insert before/after
      setPage(prev => {
        if (!prev) return prev
        const block = findBlockInSlots(prev.slots, activeId)
        if (!block) return prev
        const overLoc = findSlotContainingBlock(prev.slots, overId)
        if (!overLoc) return prev
        let updated = removeBlockFromSlots(prev.slots, activeId)
        if (overLoc.parentId) {
          updated = insertBlockIntoSlots(updated, overLoc.parentId, overLoc.slotName, overLoc.index, block)
        } else {
          const arr = [...(updated[overLoc.slotName] || [])]
          arr.splice(overLoc.index, 0, block)
          updated[overLoc.slotName] = arr
        }
        return { ...prev, slots: updated }
      })
    }
  }

  async function save(publish?: boolean) {
    if (!page) return
    setSaving(true)
    const body = publish !== undefined ? { ...page, published: publish } : page
    const res = await fetch(`/api/pages/${page.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      const updated = await res.json()
      setPage(updated)
      setSaveMsg('已保存 ✓')
      setTimeout(() => setSaveMsg(''), 2000)
      if (publish !== undefined) {
        try { await fetch(`/api/pages/${page.id}/draft`, { method: 'DELETE' }) } catch (e) { console.error('清除草稿失败', e) }
      }
    }
    setSaving(false)
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400">加载中…</div>
  if (!page) return <div className="h-screen flex items-center justify-center text-red-400">页面不存在</div>

  const allLayoutOptions = [...LAYOUT_OPTIONS, ...extraLayouts]
  const selectedBlock = getSelectedBlock()

  return (
    <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">

        {/* ── 顶栏 ── */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4 shrink-0 shadow-sm">
          <button onClick={() => router.push('/admin/pages')}
            className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1 shrink-0">← 返回</button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <input value={page.title} onChange={e => setPage({ ...page, title: e.target.value })}
            className="font-semibold text-gray-800 bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-indigo-400 px-1 min-w-0 w-36"
            placeholder="页面标题" />
          <span className="text-gray-300 shrink-0 text-sm">/pages/</span>
          <input value={page.slug} onChange={e => setPage({ ...page, slug: e.target.value.replace(/[^a-z0-9-]/g, '-') })}
            className="text-gray-600 bg-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-200 w-28"
            placeholder="url-slug" />
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <div className="flex items-center gap-1 shrink-0">
            {allLayoutOptions.map(l => (
              <button key={l.value} onClick={() => handleLayoutChange(l.value as LayoutType)} title={l.label}
                className={`px-2 py-1.5 text-xs rounded-lg border transition ${page.layout === l.value ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}>
                <span className="mr-1">{l.icon}</span>{l.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
            {([{ key: 'desktop', icon: '🖥', label: '桌面' }, { key: 'tablet', icon: '📱', label: '平板' }, { key: 'mobile', icon: '📲', label: '手机' }] as const).map(d => (
              <button key={d.key} onClick={() => setDevice(d.key)} title={d.label}
                className={`px-2 py-1 text-sm rounded transition ${device === d.key ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                {d.icon}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{draftSaving ? '⏳ 草稿保存中…' : draftSaved ? '草稿 ✓' : ''}</span>
          <a href={`/pages/${page.slug}?preview=1`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 transition shrink-0">
            ↗ 全屏预览
          </a>
          {saveMsg && <span className="text-green-500 text-sm shrink-0">{saveMsg}</span>}
          <button onClick={() => save()} disabled={saving}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 shrink-0">
            {saving ? '保存中…' : '保存'}
          </button>
          <button onClick={() => save(!page.published)} disabled={saving}
            className={`px-4 py-1.5 text-sm rounded-lg transition disabled:opacity-50 shrink-0 font-medium ${page.published ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
            {page.published ? '取消发布' : '发布'}
          </button>
        </div>

        {/* ── 三栏主体 ── */}
        <Group orientation="horizontal" className="flex-1 overflow-hidden">
          <Panel defaultSize="18%" minSize="160px" maxSize="320px">
            <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-y-hidden">
              <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                <div className="text-sm font-semibold text-gray-700">积木库</div>
                <div className="text-xs text-gray-400 mt-0.5">拖动积木到画布</div>
              </div>
              <BlockLibrary />
            </div>
          </Panel>
          <Separator className="w-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-col-resize transition-colors" />
          <Panel defaultSize="57%" minSize="320px">
            <div className="h-full bg-gray-100 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shrink-0">
                <span className="text-xs text-gray-400 font-mono flex-1">/pages/{page.slug}</span>
                <a href={`/pages/${page.slug}`} target="_blank"
                  className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition">在新标签打开 ↗</a>
                <span className="text-xs text-gray-400">
                  {device === 'desktop' ? '🖥 1280px' : device === 'tablet' ? '📱 768px' : '📲 390px'}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-6">
                  <CanvasArea page={page} selectedId={selectedId}
                    onSelect={id => setSelectedId(id)}
                    onDelete={(slot, id) => deleteBlock(slot, id)}
                    device={device} />
                </div>
              </div>
            </div>
          </Panel>
          <Separator className="w-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-col-resize transition-colors" />
          <Panel defaultSize="25%" minSize="220px" maxSize="480px">
            <div className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden">
              <Group orientation="vertical" className="flex-1 overflow-hidden">
                <Panel defaultSize="55%" minSize="120px">
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 shrink-0 flex items-center gap-1.5">
                      <span className="text-xs">⚙️</span>
                      <span className="text-xs font-semibold text-gray-600">配置</span>
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      {selectedBlock ? (
                        <ConfigPanel block={selectedBlock}
                          onUpdate={props => updateBlockProps(props)}
                          onUpdateStyle={style => updateBlockStyle(style)}
                          onUpdateLabel={label => updateBlockLabel(label)}
                          onDelete={() => { const slot = findSlotForBlock(selectedId!); if (slot && selectedId) deleteBlock(slot, selectedId) }}
                          onClose={() => setSelectedId(null)} />
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
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                                插槽间距 <span className="text-indigo-500 font-semibold">{page.layoutConfig?.gutter ?? 24}px</span>
                              </label>
                              <input type="range" min={0} max={80} step={4} value={page.layoutConfig?.gutter ?? 24}
                                onChange={e => setPage(p => p ? { ...p, layoutConfig: { ...(p.layoutConfig || {}), gutter: Number(e.target.value) } } : p)}
                                className="w-full accent-indigo-500" />
                              <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>无</span><span>紧凑</span><span>默认</span><span>宽松</span></div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                                容器内边距 <span className="text-indigo-500 font-semibold">{page.layoutConfig?.padding ?? 32}px</span>
                              </label>
                              <input type="range" min={0} max={96} step={8} value={page.layoutConfig?.padding ?? 32}
                                onChange={e => setPage(p => p ? { ...p, layoutConfig: { ...(p.layoutConfig || {}), padding: Number(e.target.value) } } : p)}
                                className="w-full accent-indigo-500" />
                              <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>无</span><span>小</span><span>中</span><span>大</span></div>
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
                <Separator className="h-1.5 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-row-resize transition-colors" />
                <Panel defaultSize="45%" minSize="120px">
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 shrink-0 flex items-center gap-1.5">
                      <span className="text-xs">👁</span>
                      <span className="text-xs font-semibold text-gray-600">实时预览</span>
                      {draftSaving && <span className="text-xs text-amber-500">保存中…</span>}
                      {!draftSaving && draftSaved && <span className="text-xs text-green-500">已更新 ✓</span>}
                      <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setPreviewFit('responsive')} title="响应式：iframe 以面板实际宽度渲染"
                          className={`px-2 py-0.5 rounded-md text-xs transition ${previewFit === 'responsive' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>响应式</button>
                        <button onClick={() => setPreviewFit('scale')} title="缩放适配：以 1200px 全宽渲染后等比缩小"
                          className={`px-2 py-0.5 rounded-md text-xs transition ${previewFit === 'scale' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>适配</button>
                      </div>
                      <button onClick={() => setMultiPreviewOpen(true)} title="三端并排全屏预览"
                        className="ml-2 px-2 py-0.5 rounded-md text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition">多端</button>
                    </div>
                    <div ref={previewContainerRef} className="flex-1 overflow-hidden relative bg-gray-50">
                      {page?.slug?.trim() ? (
                        <iframe ref={iframeRef} key={previewKey} src={`/pages/${page.slug}?preview=1`}
                          className="border-0 bg-white" style={{ width: '100%', height: '100%' }} title="实时预览" />
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300 h-full">
                          <span className="text-4xl">📄</span>
                          <p className="text-sm">设置 URL Slug 后可在此预览页面</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </Group>
            </div>
          </Panel>
        </Group>
      </div>
    </DndContext>

    {/* ── 全屏三端预览 Modal ── */}
    {multiPreviewOpen && (() => {
      const availableWidth = windowWidth - 96
      const containerHeight = (typeof window !== 'undefined' ? window.innerHeight : 900) - 120
      const widthRatios: Record<number, number> = { 1280: 0.45, 768: 0.30, 390: 0.25 }
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#1a1a2e' }} className="flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
            <div className="text-white/60 text-sm">/pages/{page.slug} — 多端预览</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewKey(k => k + 1)}
                className="text-white/40 hover:text-white text-xs px-3 py-1 rounded border border-white/20 hover:border-white/40 transition">刷新</button>
              <button onClick={() => setMultiPreviewOpen(false)} className="text-white/40 hover:text-white transition text-lg leading-none">✕</button>
            </div>
          </div>
          <div className="flex-1 flex items-start justify-center gap-6 px-8 py-6 overflow-x-auto">
            {DEVICES.map(dev => {
              const containerWidth = availableWidth * widthRatios[dev.width]
              const scale = containerWidth / dev.width
              return <DeviceFrame key={dev.width} device={dev} url={`/pages/${page.slug}?preview=1`} containerHeight={containerHeight} scale={scale} />
            })}
          </div>
        </div>
      )
    })()}
    </>
  )
}
