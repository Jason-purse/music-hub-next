import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, containerStyle } from './utils'

export function Magazine({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-7xl mx-auto" style={containerStyle(padding)}>
      {/*
        Magazine 布局：大图左（featured）+ 右侧内容竖排
        桌面端: [3fr_2fr] 两栏
        手机端: 单列堆叠（featured 在上）
      */}
      <div
        className="grid grid-cols-1 md:grid-cols-[3fr_2fr]"
        style={{ gap: responsiveGap(gutter) }}
      >
        {/* 左侧：主角内容（封面/焦点） */}
        <div className="min-w-0 min-h-48">
          <SlotRenderer blocks={slots.featured || []} gutter={gutter} />
        </div>
        {/* 右侧：次要内容列表 */}
        <div className="min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: responsiveGap(gutter) }}>
          <SlotRenderer blocks={slots.secondary || []} gutter={gutter} />
        </div>
      </div>
    </div>
  )
}
