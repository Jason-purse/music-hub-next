/**
 * lib/plugins/seed.ts — Seeds built-in plugins into the DB on first run.
 * Called from Plugin API routes to ensure built-ins always exist.
 */
import { upsertPlugin, getPluginById, updatePluginManifest } from '@/lib/plugins-db'
import type { PluginManifest } from '@/types/plugin'

const BUILTIN_MANIFESTS: PluginManifest[] = [
  {
    id: 'color-scheme',
    name: '显示模式',
    version: '1.0.0',
    category: 'appearance',
    tier: 'builtin',
    priority: 0,
    builtin: true,
    defaultEnabled: true,
    uiSlots: ['navbar'],
    description: '浅色/深色/护眼/跟随系统四态切换',
    config: {
      schema: {
        default: {
          type: 'select',
          label: '默认显示模式',
          default: 'system',
          options: [
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色模式' },
            { value: 'dark', label: '深色模式' },
            { value: 'eye-care', label: '护眼模式' },
          ],
        },
      },
    },
  },
  {
    id: 'back-to-top',
    name: '回到顶部',
    version: '1.0.0',
    category: 'ui',
    tier: 'builtin',
    priority: 0,
    builtin: true,
    defaultEnabled: true,
    uiSlots: ['floating'],
    description: '页面右下角回到顶部按钮，滚动超过阈值后出现',
    config: {
      schema: {
        threshold: {
          type: 'number',
          label: '触发滚动距离 (px)',
          default: 0,
          description: '滚动超过此距离后按钮出现',
        },
      },
    },
  },
  {
    id: 'reading-progress',
    name: '阅读进度条',
    version: '1.0.0',
    category: 'ui',
    tier: 'standard',
    priority: 0,
    builtin: true,
    defaultEnabled: false,
    uiSlots: ['top-bar'],
    description: '页面顶部进度条，显示当前滚动位置，适合长内容页面',
    config: {
      schema: {
        color: {
          type: 'color',
          label: '进度条颜色',
          default: '#6366f1',
        },
        height: {
          type: 'number',
          label: '高度 (px)',
          default: 3,
        },
      },
    },
  },
]

export function seedBuiltinPlugins(): void {
  for (const manifest of BUILTIN_MANIFESTS) {
    const existing = getPluginById(manifest.id)
    if (!existing) {
      // 新插件：按 defaultEnabled 设置初始状态
      upsertPlugin(manifest, manifest.defaultEnabled ?? true)
    } else {
      // 已存在：更新 manifest 字段但保留用户的 enabled 设置
      updatePluginManifest(manifest.id, manifest)
    }
  }
}
