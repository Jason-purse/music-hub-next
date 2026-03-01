// DataSource 系统 - 数据水龙头抽象
// Block 通过 dataSourceId 引用数据源，数据源负责取数/缓存/转换

export type DataSourceType = 'db-query' | 'internal-api' | 'http' | 'static'

export type DataSchema = 'song-list' | 'playlist-list' | 'stat-numbers' | 'generic-list'

// 参数定义（可被 Block 配置面板覆盖）
export interface ParamDef {
  type: 'string' | 'number' | 'boolean'
  default: any
  label: string
  options?: string[]  // 枚举选项
}

// db-query 配置：直接查 db.json
export interface DbQueryConfig {
  collection: 'songs' | 'playlists' | 'pages'
  filter?: Record<string, any>   // { decade: '90s' }
  sort?: string                  // 'play_count' | 'like_count' | 'created_at'
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// internal-api 配置：调用本站 API 接口
export interface InternalApiConfig {
  endpoint: string              // '/api/songs'
  method?: 'GET' | 'POST'
  params?: Record<string, any>  // 默认参数，可被 Block paramOverrides 覆盖
}

// 静态 JSON 配置
export interface StaticConfig {
  data: any[]
}

// HTTP 外部 API 配置
export interface HttpConfig {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  params?: Record<string, any>
}

export type DataSourceConfig = DbQueryConfig | InternalApiConfig | StaticConfig | HttpConfig

export interface DataSource {
  id: string
  name: string
  description?: string
  type: DataSourceType
  schema: DataSchema
  config: DataSourceConfig
  // 可被 Block 覆盖的参数声明
  params?: Record<string, ParamDef>
  // 缓存（���，0=不缓存）
  cacheTtl?: number
  // 元数据
  createdAt: string
  updatedAt: string
  // 运行时状态（不持久化）
  status?: 'ok' | 'error' | 'unknown'
  lastError?: string
  lastFetchedAt?: string
}

// Block 引用数据源的方式
export interface DataSourceRef {
  dataSourceId: string
  paramOverrides?: Record<string, any>  // 覆盖数据源的默认参数
}
