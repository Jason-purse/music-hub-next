import React from 'react'
import { blockRegistry } from './registry'
import { Block, BlockStyle } from './types'

const SHADOW_MAP = {
  none: 'none',
  sm:   '0 1px 3px rgba(0,0,0,.08)',
  md:   '0 4px 12px rgba(0,0,0,.10)',
  lg:   '0 8px 24px rgba(0,0,0,.14)',
}

function blockWrapperStyle(s?: BlockStyle): React.CSSProperties {
  if (!s) return {}
  return {
    marginTop:     s.marginTop    != null ? `${s.marginTop}px`    : undefined,
    marginBottom:  s.marginBottom != null ? `${s.marginBottom}px` : undefined,
    padding:       (s.paddingX != null || s.paddingY != null)
                     ? `${s.paddingY ?? 0}px ${s.paddingX ?? 0}px`
                     : undefined,
    backgroundColor: s.bgColor   || undefined,
    borderRadius:  s.borderRadius != null ? `${s.borderRadius}px` : undefined,
    boxShadow:     s.shadow && s.shadow !== 'none' ? SHADOW_MAP[s.shadow] : undefined,
    overflow:      s.borderRadius ? 'hidden' : undefined,
  }
}

// ─── 布局块渲染器 ──────────────────────────────────────────────────────────────

function renderSlotChildren(children: Record<string, Block[]> | undefined, slotName: string, gutter: number): React.ReactNode {
  if (!children || !children[slotName]) return null
  return <SlotRenderer blocks={children[slotName]} gutter={gutter} />
}

function LayoutContainerRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  const maxW = p.maxWidth ? `${p.maxWidth}px` : undefined
  const centered = p.centered !== false
  return (
    <div style={{
      paddingLeft: `${Number(p.paddingX) || 24}px`,
      paddingRight: `${Number(p.paddingX) || 24}px`,
      paddingTop: `${Number(p.paddingY) || 48}px`,
      paddingBottom: `${Number(p.paddingY) || 48}px`,
      background: (p.background as string) || 'transparent',
    }}>
      <div style={{ maxWidth: maxW, margin: centered ? '0 auto' : undefined }}>
        {renderSlotChildren(block.children, 'default', gutter)}
      </div>
    </div>
  )
}

function LayoutFlexRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  const ALIGN_MAP: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
  const JUSTIFY_MAP: Record<string, string> = {
    'flex-start': 'flex-start', start: 'flex-start',
    center: 'center',
    'flex-end': 'flex-end', end: 'flex-end',
    'space-between': 'space-between', between: 'space-between',
  }
  return (
    <div style={{
      display: 'flex',
      flexDirection: (p.direction as 'row' | 'column') || 'row',
      gap: `${Number(p.gap) || 16}px`,
      alignItems: ALIGN_MAP[(p.align as string) || 'stretch'] || 'stretch',
      justifyContent: JUSTIFY_MAP[(p.justify as string) || 'flex-start'] || 'flex-start',
      flexWrap: p.wrap ? 'wrap' : 'nowrap',
      padding: `${Number(p.padding) || 0}px`,
    }}>
      {renderSlotChildren(block.children, 'default', gutter)}
    </div>
  )
}

function LayoutGridRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Number(p.columns) || 3}, 1fr)`,
      gap: `${Number(p.gap) || 16}px`,
      padding: `${Number(p.padding) || 0}px`,
    }}>
      {renderSlotChildren(block.children, 'default', gutter)}
    </div>
  )
}

function LayoutColumnsRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  const ratio = (p.ratio as string) || '1:1'
  const parts = ratio.split(':').map(Number)
  const total = parts.reduce((a: number, b: number) => a + b, 0)
  const slotNames = parts.length >= 3 ? ['col1', 'col2', 'col3'] : ['col1', 'col2']
  return (
    <div style={{
      display: 'flex',
      gap: `${Number(p.gap) || 24}px`,
      alignItems: (p.align as string) || 'flex-start',
    }}>
      {parts.map((part: number, i: number) => (
        <div key={slotNames[i] || `col${i+1}`} style={{ flex: part / total }}>
          {renderSlotChildren(block.children, slotNames[i] || `col${i+1}`, gutter)}
        </div>
      ))}
    </div>
  )
}

function LayoutStackRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  const alignMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' }
  const justifyMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end' }
  return (
    <div style={{ position: 'relative', minHeight: `${Number(p.minHeight) || 320}px` }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {renderSlotChildren(block.children, 'background', gutter)}
      </div>
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: alignMap[(p.align as string) || 'center'] || 'center',
        justifyContent: justifyMap[(p.justify as string) || 'center'] || 'center',
        minHeight: `${Number(p.minHeight) || 320}px`,
      }}>
        {renderSlotChildren(block.children, 'foreground', gutter)}
      </div>
    </div>
  )
}

const CARD_SHADOW_MAP: Record<string, string> = {
  none: '',
  sm: '0 1px 3px rgba(0,0,0,.1)',
  md: '0 4px 16px rgba(0,0,0,.08)',
  lg: '0 8px 32px rgba(0,0,0,.12)',
}

function LayoutCardRenderer({ block, gutter }: { block: Block; gutter: number }) {
  const p = block.props
  return (
    <div style={{
      padding: `${Number(p.padding) || 16}px`,
      borderRadius: `${Number(p.borderRadius) || 8}px`,
      boxShadow: CARD_SHADOW_MAP[(p.shadow as string) || 'md'] || CARD_SHADOW_MAP.md,
      background: (p.bgColor as string) || '#ffffff',
    }}>
      {renderSlotChildren(block.children, 'default', gutter)}
    </div>
  )
}

// ─── 布局块渲染器映射 ──────────────────────────────────────────────────────────

const LAYOUT_RENDERERS: Record<string, React.FC<{ block: Block; gutter: number }>> = {
  'layout-container': LayoutContainerRenderer,
  'layout-flex':      LayoutFlexRenderer,
  'layout-grid':      LayoutGridRenderer,
  'layout-columns':   LayoutColumnsRenderer,
  'layout-stack':     LayoutStackRenderer,
  'layout-card':      LayoutCardRenderer,
}

// ─── SlotRenderer ──────────────────────────────────────────────────────────────

interface Props {
  blocks: Block[]
  gutter?: number
}

export function SlotRenderer({ blocks, gutter = 24 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gutter}px` }}>
      {(blocks || []).map(block => {
        // 先检查是否是布局块
        const LayoutRenderer = LAYOUT_RENDERERS[block.type]
        if (LayoutRenderer) {
          return (
            <div key={block.id} style={blockWrapperStyle(block.style)}>
              <LayoutRenderer block={block} gutter={gutter} />
            </div>
          )
        }

        // 然后检查旧的 blockRegistry
        const plugin = blockRegistry.get(block.type)
        if (!plugin) {
          return (
            <div key={block.id} style={blockWrapperStyle(block.style)}
              className="p-4 bg-red-50 text-red-500 rounded-xl border border-red-100">
              未知组件: {block.type}
            </div>
          )
        }
        const Comp = plugin.Component
        return (
          <div key={block.id} style={blockWrapperStyle(block.style)}>
            <Comp props={block.props} />
          </div>
        )
      })}
    </div>
  )
}
