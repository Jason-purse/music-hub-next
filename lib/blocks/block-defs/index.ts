'use client'
/**
 * 注册所有积木到 BlockRegistry
 * 在客户端入口导入此文件即可完成注册。
 */
import { blockRegistry } from '../block-registry'

// Content blocks
import {
  heroBannerDef, searchBarDef, chartListDef,
  decadeStackDef, playlistGridDef, statsCardDef, spacerDef,
} from './content-blocks'

// Layout blocks
import {
  layoutContainerDef, layoutFlexDef, layoutGridDef,
  layoutColumnsDef, layoutStackDef, layoutCardDef, navDockDef,
} from './layout-blocks'

// Register all
blockRegistry
  .register(heroBannerDef)
  .register(searchBarDef)
  .register(chartListDef)
  .register(decadeStackDef)
  .register(playlistGridDef)
  .register(statsCardDef)
  .register(spacerDef)
  .register(layoutContainerDef)
  .register(layoutFlexDef)
  .register(layoutGridDef)
  .register(layoutColumnsDef)
  .register(layoutStackDef)
  .register(layoutCardDef)
  .register(navDockDef)

export { blockRegistry }
