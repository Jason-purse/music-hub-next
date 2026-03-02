import type { ConfigFieldSchema, PluginAdminMenuDecl } from '@/lib/plugin-system/types'

export type { ConfigFieldSchema, ConfigFieldType } from '@/lib/plugin-system/types'

export interface PluginManifest {
  id: string
  name: string
  version: string
  category: 'appearance' | 'theme' | 'player' | 'feature' | 'source' | 'ui'
  priority: number
  builtin?: boolean
  tier?: 'core' | 'builtin' | 'standard' | 'community'
  defaultEnabled?: boolean
  uiSlots?: string[]
  description?: string
  configSchema?: ConfigFieldSchema[]    // Tier 1：manifest 声明的配置字段
  adminMenu?: PluginAdminMenuDecl[]     // Tier 2：自定义管理页（含配置页）
  slots?: string[]
  apiPrefix?: string
  pagePrefix?: string
}

export interface InstalledPlugin extends PluginManifest {
  enabled: boolean
  userConfig: Record<string, unknown>
  installedAt: string
}
