export interface PluginConfigField {
  type: 'text' | 'select' | 'color' | 'toggle' | 'number'
  label: string
  default: unknown
  options?: { value: string; label: string }[]
  description?: string
}

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
  config?: {
    schema: Record<string, PluginConfigField>
  }
  configUI?: string   // WC 标签名，若有则在 admin 插件配置页用它替代 schema 表单
  slots?: string[]
  apiPrefix?: string
  pagePrefix?: string
}

export interface InstalledPlugin extends PluginManifest {
  enabled: boolean
  userConfig: Record<string, unknown>
  installedAt: string
}
