import { LayoutType } from '../types'
import { SingleCol } from './SingleCol'
import { TwoColSidebar } from './TwoColSidebar'
import { HeroThenContent } from './HeroThenContent'
import { TwoColEqual } from './TwoColEqual'
import { ThreeCol } from './ThreeCol'
import { HeroFull } from './HeroFull'
import { Magazine } from './Magazine'
import { Timeline } from './Timeline'
import { Spotlight } from './Spotlight'
import { Block } from '../types'
import React from 'react'

export interface LayoutProps {
  slots: Record<string, Block[]>
}

export const LAYOUTS: Record<LayoutType, React.ComponentType<LayoutProps>> = {
  'single-col':        SingleCol,
  'two-col-sidebar':   TwoColSidebar,
  'hero-then-content': HeroThenContent,
  'two-col-equal':     TwoColEqual,
  'three-col':         ThreeCol,
  'hero-full':         HeroFull,
  'magazine':          Magazine,
  'timeline':          Timeline,
  'spotlight':         Spotlight,
}

export interface LayoutOption {
  label: string
  value: LayoutType
  icon: string
  slotNames: string[]
}

// 内置布局（始终可用）
export const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'single-col',        label: '单列',       icon: '▬',   slotNames: ['main'] },
  { value: 'two-col-sidebar',   label: '主+侧边栏',   icon: '▬▮',  slotNames: ['main', 'sidebar'] },
  { value: 'hero-then-content', label: 'Hero+内容区', icon: '⬛▬', slotNames: ['hero', 'content'] },
  { value: 'two-col-equal',     label: '双列均分',    icon: '▮▮',  slotNames: ['left', 'right'] },
  { value: 'three-col',         label: '三列',        icon: '▮▮▮', slotNames: ['col1', 'col2', 'col3'] },
  { value: 'hero-full',         label: '全宽Hero',    icon: '⬛',  slotNames: ['hero'] },
]

// 社区插件布局（安装后在编辑器中可选）
export const COMMUNITY_LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'magazine',  label: '杂志三栏', icon: '📰', slotNames: ['hero', 'top-right', 'bottom-right'] },
  { value: 'timeline',  label: '时间轴',   icon: '📅', slotNames: ['timeline'] },
  { value: 'spotlight', label: '聚焦布局', icon: '🎯', slotNames: ['top', 'spotlight', 'bottom'] },
]

export { SingleCol, TwoColSidebar, HeroThenContent, TwoColEqual, ThreeCol, HeroFull, Magazine, Timeline, Spotlight }
