import React from 'react'
import { blockRegistry } from './registry'
import { Block } from './types'

export function SlotRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
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
