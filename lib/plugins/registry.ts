import { BUILTIN_PLUGINS, MARKET_PLUGINS } from './builtin'
import { LayoutPlugin, MarketPlugin } from './types'

const BUILTIN_IDS = new Set(BUILTIN_PLUGINS.map(p => p.id))

async function getInstalledIds(): Promise<string[]> {
  try {
    const { getDB } = await import('@/lib/db/index')
    const db = await getDB() as any
    return db.settings?.installedPlugins || []
  } catch { return [] }
}

async function saveInstalledIds(ids: string[]): Promise<void> {
  const { patchSettings } = await import('@/lib/db/index')
  await patchSettings({ installedPlugins: ids })
}

export const pluginRegistry = {
  async getInstalled(): Promise<LayoutPlugin[]> {
    const ids = await getInstalledIds()
    const communityInstalled = MARKET_PLUGINS.filter(p => ids.includes(p.id))
    return [...BUILTIN_PLUGINS, ...communityInstalled as any]
  },

  async getMarket(): Promise<MarketPlugin[]> {
    const ids = await getInstalledIds()
    return MARKET_PLUGINS.map(p => ({ ...p, installed: ids.includes(p.id) }))
  },

  async installPlugin(pluginId: string): Promise<void> {
    const ids = await getInstalledIds()
    if (!ids.includes(pluginId)) {
      await saveInstalledIds([...ids, pluginId])
    }
  },

  async uninstallPlugin(pluginId: string): Promise<void> {
    if (BUILTIN_IDS.has(pluginId)) return
    const ids = await getInstalledIds()
    await saveInstalledIds(ids.filter(id => id !== pluginId))
  },
}
