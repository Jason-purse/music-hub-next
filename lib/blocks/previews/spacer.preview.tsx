// Spacer 预览（编辑器积木库显示用）
import React from 'react'

export function SpacerPreview() {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-2 text-gray-400">
      <div className="w-full h-px bg-gray-200" />
      <span className="text-xs">↕ 40px</span>
      <div className="w-full h-px bg-gray-200" />
    </div>
  )
}
