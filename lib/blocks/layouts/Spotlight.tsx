import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props { slots: Record<string, Block[]> }

export function Spotlight({ slots }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {(slots.top || []).length > 0 && (
        <div><SlotRenderer blocks={slots.top} /></div>
      )}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-8 shadow-sm">
        <SlotRenderer blocks={slots.spotlight || []} />
        {(slots.spotlight || []).length === 0 && (
          <p className="text-center text-indigo-300 py-8">聚焦区（放置最重要的一个组件）</p>
        )}
      </div>
      {(slots.bottom || []).length > 0 && (
        <div><SlotRenderer blocks={slots.bottom} /></div>
      )}
    </div>
  )
}
