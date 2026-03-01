/**
 * lib/plugins/seed.ts — Seeds built-in plugins into the DB on first run.
 * Called from Plugin API routes to ensure built-ins always exist.
 */
import { upsertPlugin, getPluginById } from '@/lib/plugins-db'
import type { PluginManifest } from '@/types/plugin'

const BUILTIN_MANIFESTS: PluginManifest[] = [
  {
    id: 'color-scheme',
    name: '外观模式',
    version: '1.0.0',
    category: 'appearance',
    priority: 0,
    builtin: true,
    description: '深色/浅色/跟随系统三态切换，内置功能',
    config: {
      schema: {
        default: {
          type: 'select',
          label: '默认外观',
          default: 'system',
          options: [
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ],
        },
      },
    },
  },
]

export function seedBuiltinPlugins(): void {
  for (const manifest of BUILTIN_MANIFESTS) {
    if (!getPluginById(manifest.id)) {
      upsertPlugin(manifest)
    }
  }
}
