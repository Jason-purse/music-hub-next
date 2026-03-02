/**
 * Plugin Manifest — 插件元数据声明
 * 驱动整个插件系统的核心类型
 */

export interface PluginSlotDecl {
  name: string        // Slot 名称，对应 <PluginSlot name="...">
  component: string   // WC 标签名
  props?: Record<string, string>
}

export interface PluginRouteDecl {
  path: string        // 相对于 /p/[pluginId]
  component: string   // WC 标签名
  title?: string
}

export interface PluginAdminMenuDecl {
  icon: string
  label: string
  path: string        // 相对于 /admin/p/[pluginId]
  component: string   // WC 标签名
}

export interface PluginDataEndpoint {
  path: string        // 相对路径，如 "/my-data"
  query: 'songs' | 'playlists' | 'stats' | 'data'
  params?: Record<string, unknown>
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  tier: 'builtin' | 'standard' | 'community'
  slots?: PluginSlotDecl[]
  routes?: PluginRouteDecl[]
  adminMenu?: PluginAdminMenuDecl[]
  script?: string
  configSchema?: Record<string, {
    type: 'string' | 'number' | 'boolean'
    label: string
    default?: unknown
    description?: string
  }>
  configUI?: string   // WC 标签名，若有则在 admin 插件配置页用它替代 schema 表单
  dataEndpoints?: PluginDataEndpoint[]
}
