import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { responsiveGap, responsivePad, containerStyle } from './utils'

export function Spotlight({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  return (
    <div className="max-w-6xl mx-auto" style={containerStyle(padding)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: responsiveGap(gutter) }}>
        {/* 聚焦区：突出展示单个内容 */}
        <div
          className="rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 shadow-sm"
          style={{ padding: responsivePad(gutter) }}
        >
          {(slots.spotlight || []).length > 0
            ? <SlotRenderer blocks={slots.spotlight || []} gutter={gutter} />
            : <p className="text-center text-indigo-300 py-8">聚焦区（放置最重要的一个组件）</p>
          }
        </div>

        {/* 次要内容：响应式网格 */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: responsiveGap(gutter) }}
        >
          {(slots.grid || []).map(block => (
            <div key={block.id} className="min-w-0">
              <SlotRenderer blocks={[block]} gutter={gutter} />
            </div>
          ))}
          {(slots.grid || []).length === 0 && (
            <p className="col-span-full text-center text-gray-300 py-8">网格区（可放多个组件）</p>
          )}
        </div>
      </div>
    </div>
  )
}
