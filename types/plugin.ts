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
  category: 'appearance' | 'theme' | 'player' | 'feature' | 'source'
  priority: number
  builtin?: boolean
  description?: string
  config?: {
    schema: Record<string, PluginConfigField>
  }
  slots?: string[]
  apiPrefix?: string
  pagePrefix?: string
}

export interface InstalledPlugin extends PluginManifest {
  enabled: boolean
  userConfig: Record<string, unknown>
  installedAt: string
}
