import React from 'react'
import { blockRegistry } from './registry'
import { Block } from './types'

interface Props {
  blocks: Block[]
  gutter?: number  // 块之间的间距 px，默认 24
}

export function SlotRenderer({ blocks, gutter = 24 }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gutter}px` }}>
      {(blocks || []).map(block => {
        const plugin = blockRegistry.get(block.type)
        if (!plugin) {
          return (
            <div key={block.id} className="p-4 bg-red-50 text-red-500 rounded-xl border border-red-100">
              未知组件: {block.type}
            </div>
          )
        }
        const Comp = plugin.Component
        return <Comp key={block.id} props={block.props} />
      })}
    </div>
  )
}
