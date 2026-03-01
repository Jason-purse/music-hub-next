import { BlockPlugin } from './types'

const _registry = new Map<string, BlockPlugin>()

export const blockRegistry = {
  register: (plugin: BlockPlugin) => {
    _registry.set(plugin.type, plugin)
    return blockRegistry
  },
  get: (type: string) => _registry.get(type),
  getAll: () => Array.from(_registry.values()),
}

// ── 仅含元数据（客户端安全）的简化注册 ─────────────────────────────────────────

export interface BlockMeta {
  type: string
  label: string
  icon: string
  defaultProps: Record<string, any>
  fields: import('./types').FieldDef[]
}

const _metaRegistry = new Map<string, BlockMeta>()

export const blockMetaRegistry = {
  register: (meta: BlockMeta) => {
    _metaRegistry.set(meta.type, meta)
    return blockMetaRegistry
  },
  get: (type: string) => _metaRegistry.get(type),
  getAll: () => Array.from(_metaRegistry.values()),
}
