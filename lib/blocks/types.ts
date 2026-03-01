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

export interface Block {
  id: string
  type: string        // 'hero-banner' | 'chart-list' | 'decade-stack' | 'playlist-grid' | 'search-bar' | 'stats-card'
  props: Record<string, any>
}

export type FieldType = 'text' | 'number' | 'color' | 'switch' | 'select' | 'textarea'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  options?: { label: string; value: string }[]  // select 专用
  defaultValue?: any
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
