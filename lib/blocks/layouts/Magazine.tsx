import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function Magazine({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-7xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
      <div className="grid" style={{ gridTemplateColumns: '3fr 2fr', gap: `${gutter}px` }}>
        <div style={{ gridRow: '1 / 3', minHeight: '24rem' }}>
          <SlotRenderer blocks={slots.hero || []} gutter={gutter} />
        </div>
        <div><SlotRenderer blocks={slots['top-right'] || []} gutter={gutter} /></div>
        <div><SlotRenderer blocks={slots['bottom-right'] || []} gutter={gutter} /></div>
      </div>
    </div>
  )
}
