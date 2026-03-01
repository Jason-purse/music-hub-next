import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { Block } from '../types'

interface Props {
  slots: Record<string, Block[]>
}

export function TwoColEqual({ slots }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <SlotRenderer blocks={slots.left || []} />
        </div>
        <div>
          <SlotRenderer blocks={slots.right || []} />
        </div>
      </div>
    </div>
  )
}
