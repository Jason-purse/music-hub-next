import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props { slots: Record<string, Block[]> }

export function Magazine({ slots }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid gap-6" style={{ gridTemplateColumns: '3fr 2fr' }}>
        <div style={{ gridRow: '1 / 3' }} className="min-h-96">
          <SlotRenderer blocks={slots.hero || []} />
        </div>
        <div><SlotRenderer blocks={slots['top-right'] || []} /></div>
        <div><SlotRenderer blocks={slots['bottom-right'] || []} /></div>
      </div>
    </div>
  )
}
