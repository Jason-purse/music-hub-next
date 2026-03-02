import { getAllPluginsRaw } from '../plugins-db'
import type { PluginManifest, PluginSlotDecl, PluginAdminMenuDecl, PluginBlockDecl } from './types'

export interface EnabledPlugin {
  id: string
  manifest: PluginManifest
  userConfig: Record<string, unknown>
  scriptUrl: string | null
}

export function getEnabledPlugins(): EnabledPlugin[] {
  return getAllPluginsRaw()
    .filter(p => p.enabled)
    .map(p => ({
      id: p.id,
      manifest: p.manifest as unknown as PluginManifest,
      userConfig: p.userConfig,
      scriptUrl: (p.manifest.script as string | undefined)
        ? `/api/plugins/${p.id}/script`
        : null,
    }))
}

export function getSlotPlugins(slotName: string): { plugin: EnabledPlugin; decl: PluginSlotDecl }[] {
  const result: { plugin: EnabledPlugin; decl: PluginSlotDecl }[] = []
  for (const plugin of getEnabledPlugins()) {
    for (const slot of plugin.manifest.slots ?? []) {
      if (slot.name === slotName) result.push({ plugin, decl: slot })
    }
  }
  return result
}

export function getPluginAdminMenuItems(): { plugin: EnabledPlugin; item: PluginAdminMenuDecl }[] {
  const result: { plugin: EnabledPlugin; item: PluginAdminMenuDecl }[] = []
  for (const plugin of getEnabledPlugins()) {
    for (const item of plugin.manifest.adminMenu ?? []) {
      result.push({ plugin, item })
    }
  }
  return result
}

export function getPluginBlocks(): Array<PluginBlockDecl & { pluginId: string; pluginName: string }> {
  const result: Array<PluginBlockDecl & { pluginId: string; pluginName: string }> = []
  for (const plugin of getEnabledPlugins()) {
    for (const block of plugin.manifest.blocks ?? []) {
      result.push({ ...block, pluginId: plugin.id, pluginName: plugin.manifest.name })
    }
  }
  return result
}
