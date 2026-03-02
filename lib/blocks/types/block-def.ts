/**
 * BlockDef — 积木定义（注册表条目）
 *
 * PropSchema 驱动：ConfigPanel 自动根据 propSchema 生成 UI，
 * 不再需要手写 FieldDef + FieldInput 的对应关系。
 */
import type React from 'react'

// ─── PropSchema ───────────────────────────────────────────────────────────────
export type PropType =
  | 'text'
  | 'number'
  | 'select'
  | 'color'
  | 'boolean'
  | 'spacing'
  | 'range'
  | 'datasource'

export interface PropSchema {
  key: string
  label: string
  type: PropType
  default: unknown
  description?: string
  options?: Array<{ label: string; value: unknown }>
  min?: number
  max?: number
  step?: number
}

// ─── SlotDef ──────────────────────────────────────────────────────────────────
export interface SlotDef {
  name: string
  label: string
  /** 接受的积木类型，'*' = 任意 */
  accepts: string[] | '*'
  min?: number
  max?: number
}

// ─── BlockDef ─────────────────────────────────────────────────────────────────
export type BlockCategory = 'layout' | 'music' | 'data' | 'interactive' | 'structure' | 'spacing' | 'navigation'

export interface BlockDef {
  type: string
  label: string
  icon: string
  category: BlockCategory
  tags: string[]
  /** true = 容器积木，有 slots */
  isContainer: boolean
  /** 容器积木的 slot 定义 */
  slots?: SlotDef[]
  defaultProps: Record<string, unknown>
  propSchema: PropSchema[]
  /** 画布 + 实时预览渲染器 */
  Renderer: React.FC<{
    props: Record<string, unknown>
    slots?: Record<string, React.ReactNode>
    isSelected?: boolean
  }>
  /** 积木库缩略图 */
  Thumbnail: React.FC
}
