import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function TwoColSidebar({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-6xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
      <div className="flex" style={{ gap: `${gutter}px` }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <SlotRenderer blocks={slots.main || []} gutter={gutter} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SlotRenderer blocks={slots.sidebar || []} gutter={gutter} />
        </div>
      </div>
    </div>
  )
}
