import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function ThreeCol({ slots }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-3 gap-6">
        <div>
          <SlotRenderer blocks={slots.col1 || []} />
        </div>
        <div>
          <SlotRenderer blocks={slots.col2 || []} />
        </div>
        <div>
          <SlotRenderer blocks={slots.col3 || []} />
        </div>
      </div>
    </div>
  )
}
