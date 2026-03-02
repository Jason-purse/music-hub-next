/**
 * Plugin Manifest — 插件元数据声明
 * 驱动整个插件系统的核心类型
 */

// ── 配置字段 Schema（Tier 1：manifest 声明，平台自动渲染） ──────────────────────

export type ConfigFieldType =
  | 'text' | 'password' | 'textarea'
  | 'number' | 'boolean' | 'select'
  | 'color' | 'url' | 'email'

export interface ConfigFieldSchema {
  key: string
  type: ConfigFieldType
  label: string
  description?: string
  default?: unknown
  required?: boolean
  placeholder?: string
  // select 专用
  options?: Array<{ label: string; value: string | number | boolean }>
  // number 专用
  min?: number
  max?: number
  step?: number
  // 分组（可选，同 group 的字段会被框在一起）
  group?: string
}

// ── Slot / Route / Menu / Block 声明 ────────────────────────────────────────────

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

export interface PluginBlockDecl {
  type: string          // 积木类型 ID，如 "hello-stats-card"（全局唯一，建议 pluginId-xxx）
  label: string         // 显示名称
  icon: string          // emoji 图标
  description?: string  // 简短说明
  category?: string     // 分组（可选，显示在扩展积木区内的子分类）
  component: string     // WC 标签名（用于在画布中渲染）
  defaultProps?: Record<string, unknown>  // 默认 props
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
  blocks?: PluginBlockDecl[]
  script?: string
  configSchema?: ConfigFieldSchema[]   // Tier 1：manifest 声明字段，平台自动渲染
  // Tier 2：adminMenu[0] 即为自定义配置页入口（Web Component 方式）
  dataEndpoints?: PluginDataEndpoint[]
}
