import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function HeroFull({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
        <SlotRenderer blocks={slots.hero || []} gutter={gutter} />
      </div>
    </div>
  )
}
