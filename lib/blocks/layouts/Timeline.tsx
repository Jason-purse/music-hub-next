import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'

export function Timeline({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  const blocks = slots.timeline || []
  return (
    <div className="max-w-3xl mx-auto" style={{ padding: `${padding}px 1rem` }}>
      <div className="relative">
        {blocks.length > 1 && (
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300" />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${gutter}px` }}>
          {blocks.map((block, i) => (
            <div key={block.id} className="relative flex" style={{ gap: `${gutter * 0.75}px` }}>
              <div className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-indigo-400 shadow-sm flex items-center justify-center text-xs font-bold text-indigo-600 z-10">
                {i + 1}
              </div>
              <div className="flex-1 pb-2">
                <SlotRenderer blocks={[block]} gutter={gutter} />
              </div>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="text-center text-gray-400 py-12">请在编辑器中向时间轴添加组件</p>
          )}
        </div>
      </div>
    </div>
  )
}
