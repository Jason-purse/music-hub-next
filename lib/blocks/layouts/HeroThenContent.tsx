import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function HeroThenContent({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div>
      <div className="w-full" style={{ padding: `${padding / 2}px 1rem` }}>
        <SlotRenderer blocks={slots.hero || []} gutter={gutter} />
      </div>
      <div className="max-w-5xl mx-auto" style={{ padding: `${padding}px 1rem`, paddingTop: `${gutter}px` }}>
        <SlotRenderer blocks={slots.content || []} gutter={gutter} />
      </div>
    </div>
  )
}
