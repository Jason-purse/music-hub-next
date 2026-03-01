import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function ThreeCol({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-5xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
      <div className="grid grid-cols-3" style={{ gap: `${gutter}px` }}>
        <div><SlotRenderer blocks={slots.col1 || []} gutter={gutter} /></div>
        <div><SlotRenderer blocks={slots.col2 || []} gutter={gutter} /></div>
        <div><SlotRenderer blocks={slots.col3 || []} gutter={gutter} /></div>
      </div>
    </div>
  )
}
