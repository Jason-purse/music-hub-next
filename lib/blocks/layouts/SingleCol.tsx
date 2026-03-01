import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function SingleCol({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-5xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
      <SlotRenderer blocks={slots.main || []} gutter={gutter} />
    </div>
  )
}
