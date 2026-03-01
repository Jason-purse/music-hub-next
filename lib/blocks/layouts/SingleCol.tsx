import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, containerStyle } from './utils'

export function SingleCol({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-3xl mx-auto" style={containerStyle(padding)}>
      <SlotRenderer blocks={slots.main || []} gutter={gutter} />
    </div>
  )
}
