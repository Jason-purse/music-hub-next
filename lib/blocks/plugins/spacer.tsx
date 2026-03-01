// Spacer 块 — 纯视觉空白，无实际内容
// 设计原则：
//   - 简单：只有 height 一个配置项
//   - 可见：编辑模式下有虚线边框提示，渲染时完全透明
//   - 语义：aria-hidden，不影响无障碍访问

import React from 'react'
import type { BlockPlugin, FieldDef } from '../types'

interface SpacerProps {
  height?: number   // px，默认 40
  showLine?: boolean // 是否显示分割线（可选装饰）
}

function SpacerComponent({ props }: { props: SpacerProps }) {
  const h = props.height ?? 40
  const showLine = props.showLine ?? false
  return (
    <div
      aria-hidden
      style={{ height: `${h}px`, position: 'relative' }}
    >
      {showLine && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--music-border) 20%, var(--music-border) 80%, transparent)',
        }} />
      )}
    </div>
  )
}

const fields: FieldDef[] = [
  {
    name: 'height',
    label: '高度 (px)',
    type: 'number',
    defaultValue: 40,
    description: '空白区域高度，范围 8–200px',
  },
  {
    name: 'showLine',
    label: '显示分割线',
    type: 'switch',
    defaultValue: false,
    description: '在空白中央显示一条浅色分割线',
  },
]

export const SpacerBlock: BlockPlugin = {
  type:         'spacer',
  label:        '间距填充',
  icon:         '↕️',
  Component:    SpacerComponent,
  fields,
  defaultProps: { height: 40, showLine: false },
}
