import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, containerStyle } from './utils'

export function ThreeCol({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-7xl mx-auto" style={containerStyle(padding)}>
      {/*
        桌面端 (lg+): 三列等宽
        平板端 (sm-lg): 两列
        手机端 (<sm): 单列
      */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ gap: responsiveGap(gutter) }}
      >
        <div className="min-w-0">
          <SlotRenderer blocks={slots.col1 || []} gutter={gutter} />
        </div>
        <div className="min-w-0">
          <SlotRenderer blocks={slots.col2 || []} gutter={gutter} />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          {/* 平板端第3列占满宽度（2列布局末尾对齐）*/}
          <SlotRenderer blocks={slots.col3 || []} gutter={gutter} />
        </div>
      </div>
    </div>
  )
}
