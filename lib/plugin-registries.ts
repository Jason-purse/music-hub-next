/**
 * lib/plugin-registries.ts — 插件注册表（多 registry）管理
 *
 * 存储在 plugins SQLite DB 的 plugin_data 表，plugin_id = '__system__', key = 'pluginRegistries'
 */
import { getPluginData, setPluginData } from '@/lib/plugins-db'

const SYSTEM_KEY = '__system__'
const DATA_KEY = 'pluginRegistries'

export interface PluginRegistry {
  id: string
  name: string
  url: string
  enabled: boolean
}

const DEFAULT_REGISTRIES: PluginRegistry[] = [
  {
    id: 'official',
    name: '官方市场',
    url: 'https://raw.githubusercontent.com/Jason-purse/musichub-plugins/main/index.json',
    enabled: true,
  },
]

export function getRegistries(): PluginRegistry[] {
  const data = getPluginData(SYSTEM_KEY)
  const raw = data[DATA_KEY]
  if (!raw) {
    // 首次访问：写入默认值
    setPluginData(SYSTEM_KEY, DATA_KEY, JSON.stringify(DEFAULT_REGISTRIES))
    return DEFAULT_REGISTRIES
  }
  try {
    return JSON.parse(raw)
  } catch {
    return DEFAULT_REGISTRIES
  }
}

function saveRegistries(registries: PluginRegistry[]): void {
  setPluginData(SYSTEM_KEY, DATA_KEY, JSON.stringify(registries))
}

export function addRegistry(name: string, url: string): PluginRegistry {
  const registries = getRegistries()
  const id = 'reg_' + Date.now().toString(36)
  const entry: PluginRegistry = { id, name, url, enabled: true }
  registries.push(entry)
  saveRegistries(registries)
  return entry
}

export function deleteRegistry(id: string): boolean {
  if (id === 'official') return false // 官方源不可删
  const registries = getRegistries()
  const idx = registries.findIndex(r => r.id === id)
  if (idx === -1) return false
  registries.splice(idx, 1)
  saveRegistries(registries)
  return true
}

export function updateRegistry(id: string, patch: { enabled?: boolean; name?: string; url?: string }): PluginRegistry | null {
  const registries = getRegistries()
  const entry = registries.find(r => r.id === id)
  if (!entry) return null
  if (patch.enabled !== undefined) entry.enabled = patch.enabled
  if (patch.name !== undefined) entry.name = patch.name
  if (patch.url !== undefined && id !== 'official') entry.url = patch.url // 官方源 URL 不可改
  saveRegistries(registries)
  return entry
}

export function getEnabledRegistries(): PluginRegistry[] {
  return getRegistries().filter(r => r.enabled)
}
