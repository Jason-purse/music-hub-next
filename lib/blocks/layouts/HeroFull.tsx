import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function HeroFull({ slots }: Props) {
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SlotRenderer blocks={slots.hero || []} />
      </div>
    </div>
  )
}
