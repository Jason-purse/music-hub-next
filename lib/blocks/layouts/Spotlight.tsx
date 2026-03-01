import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function Spotlight({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-6xl mx-auto" style={{ padding: `${padding}px 1rem`, display: 'flex', flexDirection: 'column', gap: `${gutter}px` }}>
      {(slots.top || []).length > 0 && (
        <div><SlotRenderer blocks={slots.top} gutter={gutter} /></div>
      )}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 shadow-sm" style={{ padding: `${gutter}px` }}>
        <SlotRenderer blocks={slots.spotlight || []} gutter={gutter} />
        {(slots.spotlight || []).length === 0 && (
          <p className="text-center text-indigo-300 py-8">聚焦区（放置最重要的一个组件）</p>
        )}
      </div>
      {(slots.bottom || []).length > 0 && (
        <div><SlotRenderer blocks={slots.bottom} gutter={gutter} /></div>
      )}
    </div>
  )
}
