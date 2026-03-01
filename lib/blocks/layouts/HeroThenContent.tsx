import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function HeroThenContent({ slots }: Props) {
  return (
    <div>
      {/* 全宽 hero */}
      <div className="w-full px-4 py-4">
        <SlotRenderer blocks={slots.hero || []} />
      </div>
      {/* 内容区 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <SlotRenderer blocks={slots.content || []} />
      </div>
    </div>
  )
}
