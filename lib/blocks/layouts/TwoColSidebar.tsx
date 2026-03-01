import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function TwoColSidebar({ slots }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0" style={{ flex: '2' }}>
          <SlotRenderer blocks={slots.main || []} />
        </div>
        <div className="shrink-0" style={{ flex: '1', minWidth: 0 }}>
          <SlotRenderer blocks={slots.sidebar || []} />
        </div>
      </div>
    </div>
  )
}
