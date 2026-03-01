import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, responsivePad, containerStyle } from './utils'

export function HeroThenContent({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: responsiveGap(gutter) }}>
      {/* Hero：半宽 banner */}
      <div
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600"
        style={{ padding: `${responsivePad(padding / 1.5)} 1rem` }}
      >
        <div className="max-w-5xl mx-auto">
          <SlotRenderer blocks={slots.hero || []} gutter={gutter} />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto w-full" style={containerStyle(padding)}>
        {/*
          内容区：桌面端两栏（主+侧边），手机端单列
        */}
        {(slots.sidebar || []).length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-[1fr_280px]"
            style={{ gap: responsiveGap(gutter) }}
          >
            <div className="min-w-0">
              <SlotRenderer blocks={slots.main || []} gutter={gutter} />
            </div>
            <div className="min-w-0">
              <SlotRenderer blocks={slots.sidebar || []} gutter={gutter} />
            </div>
          </div>
        ) : (
          <SlotRenderer blocks={slots.main || []} gutter={gutter} />
        )}
      </div>
    </div>
  )
}
