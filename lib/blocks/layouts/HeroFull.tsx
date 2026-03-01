import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, responsivePad, containerStyle } from './utils'

export function HeroFull({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="w-full">
      {/* Hero 区：全宽，高度响应式 */}
      <div
        className="w-full bg-gradient-to-br from-indigo-50 to-purple-50"
        style={{
          minHeight: 'clamp(200px, 35vh, 480px)',
          padding: `${responsivePad(padding)} 1rem`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <SlotRenderer blocks={slots.hero || []} gutter={gutter} />
        </div>
      </div>
      {/* 内容区 */}
      {(slots.content || []).length > 0 && (
        <div className="max-w-6xl mx-auto" style={containerStyle(padding)}>
          <SlotRenderer blocks={slots.content || []} gutter={gutter} />
        </div>
      )}
    </div>
  )
}
