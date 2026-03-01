import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, containerStyle } from './utils'

export function TwoColSidebar({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-6xl mx-auto" style={containerStyle(padding)}>
      {/*
        桌面端 (md+): sidebar 280px + 主内容 1fr
        手机端 (<md): 单列堆叠，sidebar 在上
        gap 用 clamp() 自动缩放
      */}
      <div
        className="grid grid-cols-1 md:grid-cols-[280px_1fr]"
        style={{ gap: responsiveGap(gutter) }}
      >
        <div className="min-w-0">
          <SlotRenderer blocks={slots.sidebar || []} gutter={gutter} />
        </div>
        <div className="min-w-0">
          <SlotRenderer blocks={slots.main || []} gutter={gutter} />
        </div>
      </div>
    </div>
  )
}
