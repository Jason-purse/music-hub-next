import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function SingleCol({ slots }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <SlotRenderer blocks={slots.main || []} />
    </div>
  )
}
