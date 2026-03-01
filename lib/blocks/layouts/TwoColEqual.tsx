import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, containerStyle } from './utils'

export function TwoColEqual({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-5xl mx-auto" style={containerStyle(padding)}>
      {/*
        桌面端: 两列等宽
        手机端: 单列堆叠
      */}
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: responsiveGap(gutter) }}
      >
        <div className="min-w-0">
          <SlotRenderer blocks={slots.left || []} gutter={gutter} />
        </div>
        <div className="min-w-0">
          <SlotRenderer blocks={slots.right || []} gutter={gutter} />
        </div>
      </div>
    </div>
  )
}
