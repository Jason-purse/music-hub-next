import { blockRegistry } from './registry'
import { HeroBannerBlock } from './plugins/hero-banner'
import { ChartListBlock } from './plugins/chart-list'
import { DecadeStackBlock } from './plugins/decade-stack'
import { PlaylistGridBlock } from './plugins/playlist-grid'
import { SearchBarBlock } from './plugins/search-bar'
import { StatsCardBlock } from './plugins/stats-card'
import { SpacerBlock } from './plugins/spacer'

blockRegistry
  .register(HeroBannerBlock)
  .register(ChartListBlock)
  .register(DecadeStackBlock)
  .register(PlaylistGridBlock)
  .register(SearchBarBlock)
  .register(StatsCardBlock)
  .register(SpacerBlock)

export { blockRegistry }
export * from './types'
export { SlotRenderer } from './SlotRenderer'
