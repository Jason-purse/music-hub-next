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
    overflow:      s.borderRadius ? 'hidden' : undefined, // 防止子元素撑破圆角
  }
}

interface Props {
  blocks: Block[]
  gutter?: number  // 块之间间距 px（layout 级别传入，默认 24）
}

export function SlotRenderer({ blocks, gutter = 24 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gutter}px` }}>
      {(blocks || []).map(block => {
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
