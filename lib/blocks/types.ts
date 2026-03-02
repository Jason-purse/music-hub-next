import type React from 'react'

export type LayoutType =
  | 'single-col'
  | 'two-col-sidebar'
  | 'hero-then-content'
  | 'two-col-equal'
  | 'three-col'
  | 'hero-full'
  | 'magazine'
  | 'timeline'
  | 'spotlight'

export interface LayoutConfig {
  gutter?: number      // 插槽之间的间距，单位 px，默认 24
  padding?: number     // 布局容器内边距，单位 px，默认 32
}

export interface PageDescriptor {
  id: string
  slug: string        // URL: /pages/[slug]
  title: string
  layout: LayoutType
  slots: Record<string, Block[]>  // { main: [...], sidebar: [...] }
  layoutConfig?: LayoutConfig     // 布局级配置（间距、内边距等）
  published: boolean
  createdAt: number
  updatedAt: number
  draft?: {
    layout: LayoutType
    slots: Record<string, Block[]>
    layoutConfig?: LayoutConfig
  }
}

export interface BlockStyle {
  marginTop?: number       // 块上方留白 px
  marginBottom?: number    // 块下方留白 px
  paddingX?: number        // 块横向内边距 px
  paddingY?: number        // 块纵向内边距 px
  bgColor?: string         // 背景色（'transparent' | '#fff' | ...）
  borderRadius?: number    // 圆角 px
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export interface Block {
  id: string
  type: string
  props: Record<string, any>
  style?: BlockStyle        // 可选外壳样式，由 SlotRenderer 处理，插件不感知
  label?: string            // 用户自定义显示名（TOC/画布标识，不影响插件渲染）
  children?: Record<string, Block[]>  // 布局块专用：key = 插槽名，value = 子积木列表
}

export type FieldType = 'text' | 'number' | 'color' | 'switch' | 'select' | 'textarea' | 'datasource'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  options?: { label: string; value: string }[]  // select 专用
  defaultValue?: any
  description?: string  // 字段说明文字（可选）
}

export interface BlockPlugin<TProps = any> {
  type: string
  label: string
  icon: string
  defaultProps: TProps
  fields: FieldDef[]
  slotNames?: string[]           // 该骨架暴露的插槽名（仅骨架用）
  Component: React.ComponentType<{ props: TProps }>  // Server Component OK
}
