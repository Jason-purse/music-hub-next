'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { ConfigFieldSchema } from '@/types/plugin'
import { PluginWCHost } from '@/components/PluginWCHost'

interface PluginItem {
  id: string
  name: string
  description?: string
  version: string
  category: string
  tier?: string
  enabled: boolean
  builtin?: boolean
  defaultEnabled?: boolean
  config?: { schema: Record<string, ConfigFieldSchema> }
  configUI?: string
  userConfig: Record<string, unknown>
}

interface MarketPlugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  tags?: string[]
  registryUrl?: string
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [configPlugin, setConfigPlugin] = useState<PluginItem | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'installed' | 'market'>('installed')

  // Market state
  const [marketPlugins, setMarketPlugins] = useState<MarketPlugin[]>([])
  const [marketLoading, setMarketLoading] = useState(false)
  const [installingId, setInstallingId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const fetchPlugins = useCallback(async () => {
    const res = await fetch('/api/plugins')
    if (res.ok) {
      const data = await res.json()
      setPlugins(data.plugins || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlugins() }, [fetchPlugins])

  // Load market plugins when switching to market tab
  useEffect(() => {
    if (activeTab === 'market') {
      setMarketLoading(true)
      fetch('/api/plugins/market')
        .then(r => r.json())
        .then(data => setMarketPlugins(data.plugins || []))
        .catch(() => setMarketPlugins([]))
        .finally(() => setMarketLoading(false))
    }
  }, [activeTab])

  const toggle = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/plugins/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    if (res.ok) {
      setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled } : p))
      showToast(enabled ? '✅ 已启用' : '✅ 已禁用')
    }
  }

  const handleDelete = async (plugin: PluginItem) => {
    if (plugin.builtin) return
    if (!confirm(`确认卸载插件「${plugin.name}」？`)) return
    const res = await fetch(`/api/plugins/${plugin.id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('✅ 已卸载')
      await fetchPlugins()
    } else {
      const err = await res.json()
      showToast(`❌ ${err.error || '卸载失败'}`)
    }
  }

  const handleInstall = async (plugin: MarketPlugin) => {
    setInstallingId(plugin.id)
    try {
      const res = await fetch('/api/plugins/market/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, registryUrl: plugin.registryUrl }),
      })
      if (res.ok) {
        showToast('✅ 安装成功')
        await fetchPlugins()
      } else {
        const err = await res.json()
        showToast(`❌ ${err.error || '安装失败'}`)
      }
    } catch {
      showToast('❌ 安装失败，请重试')
    } finally {
      setInstallingId(null)
    }
  }

  function openConfig(plugin: PluginItem) {
    setConfigPlugin(plugin)
    if (!plugin.configUI) {
      const schema = plugin.config?.schema || {}
      const initial: Record<string, unknown> = {}
      for (const [key, field] of Object.entries(schema)) {
        initial[key] = plugin.userConfig[key] ?? field.default
      }
      setConfigValues(initial)
    }
  }

  async function saveConfig() {
    if (!configPlugin) return
    setSaving(true)
    const res = await fetch(`/api/plugins/${configPlugin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configValues }),
    })
    if (res.ok) {
      showToast('✅ 配置已保存')
      setConfigPlugin(null)
      await fetchPlugins()
    } else {
      const err = await res.json()
      showToast(`❌ ${err.error || '保存失败'}`)
    }
    setSaving(false)
  }

  function renderField(key: string, field: ConfigFieldSchema) {
    const value = configValues[key]
    const onChange = (v: unknown) => setConfigValues(prev => ({ ...prev, [key]: v }))

    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
        {field.description && (
          <p className="text-xs text-gray-400 mb-1">{field.description}</p>
        )}
        {field.type === 'select' && (
          <select
            value={String(value ?? field.default ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
          >
            {(field.options || []).map((opt: { label: string; value: string | number | boolean }) => (
              <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
            ))}
          </select>
        )}
        {field.type === 'text' && (
          <input
            type="text"
            value={String(value ?? field.default ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
          />
        )}
        {field.type === 'color' && (
          <input
            type="color"
            value={String(value ?? field.default ?? '#000000')}
            onChange={e => onChange(e.target.value)}
            className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
          />
        )}
        {field.type === 'boolean' && (
          <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        )}
        {field.type === 'number' && (
          <input
            type="number"
            value={Number(value ?? field.default ?? 0)}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
          />
        )}
      </div>
    )
  }

  const hasConfig = (plugin: PluginItem) => {
    if (plugin.configUI) return true
    return plugin.config?.schema && Object.keys(plugin.config.schema).length > 0
  }

  const TIER_LABELS: Record<string, string> = {
    core: '核心',
    builtin: '内置',
    standard: '标准',
    community: '社区',
  }
  const TIER_COLORS: Record<string, string> = {
    builtin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    standard: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    community: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    core: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  }

  const PluginCard = ({ plugin }: { plugin: PluginItem }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{plugin.name}</span>
          <span className="text-xs text-gray-400">v{plugin.version}</span>
          {plugin.tier && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[plugin.tier] || TIER_COLORS.community}`}>
              {TIER_LABELS[plugin.tier] || plugin.tier}
            </span>
          )}
          {!plugin.enabled && plugin.defaultEnabled && (
            <span className="text-xs text-amber-600 dark:text-amber-400">已关闭</span>
          )}
        </div>
        {plugin.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plugin.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {hasConfig(plugin) && (
          <button
            onClick={() => openConfig(plugin)}
            className="px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition"
          >
            配置
          </button>
        )}
        {!plugin.builtin && (
          <button
            onClick={() => handleDelete(plugin)}
            className="px-3 py-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            卸载
          </button>
        )}
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={plugin.enabled}
              onChange={e => toggle(plugin.id, e.target.checked)}
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${plugin.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${plugin.enabled ? 'translate-x-5' : ''}`} />
          </div>
        </label>
      </div>
    </div>
  )

  const builtinPlugins = plugins.filter(p => p.tier === 'builtin' || p.tier === 'standard' || p.tier === 'core' || (p.builtin && !p.tier))
  const communityPlugins = plugins.filter(p => !p.builtin && p.tier === 'community')
  const installedIds = new Set(plugins.map(p => p.id))

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← 返回管理</Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">🧩 插件管理</h1>
      </div>
      <div className="p-6 text-gray-400">加载中...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← 返回管理</Link>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">🧩 插件管理</h1>
        {toast && (
          <div className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium border ${
            toast.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>{toast}</div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          管理站点功能插件。内置插件随系统提供，可以关闭但无法卸载。
          开关变更后刷新页面生效。
        </p>

        {/* Tab 切换 */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'installed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            已安装
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'market'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            插件市场
          </button>
        </div>

        {/* 已安装 Tab */}
        {activeTab === 'installed' && (
          <>
            {builtinPlugins.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  内置插件
                </h2>
                <div className="space-y-3">
                  {builtinPlugins.map(p => <PluginCard key={p.id} plugin={p} />)}
                </div>
              </section>
            )}

            {communityPlugins.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  已安装插件
                </h2>
                <div className="space-y-3">
                  {communityPlugins.map(p => <PluginCard key={p.id} plugin={p} />)}
                </div>
              </section>
            )}

            {plugins.length === 0 && (
              <div className="text-center text-gray-400 py-16">暂无插件</div>
            )}
          </>
        )}

        {/* 插件市场 Tab */}
        {activeTab === 'market' && (
          <div>
            {marketLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3" />
                      </div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : marketPlugins.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                插件市场暂时不可用，请检查注册表配置
              </div>
            ) : (
              <div className="space-y-3">
                {marketPlugins.map(plugin => (
                  <div key={plugin.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{plugin.name}</span>
                        <span className="text-xs text-gray-400">v{plugin.version}</span>
                        {plugin.author && (
                          <span className="text-xs text-gray-400">by {plugin.author}</span>
                        )}
                      </div>
                      {plugin.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plugin.description}</p>
                      )}
                      {plugin.tags && plugin.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plugin.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {installedIds.has(plugin.id) ? (
                        <button
                          disabled
                          className="px-3 py-1.5 text-sm text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
                        >
                          已安装
                        </button>
                      ) : (
                        <button
                          onClick={() => handleInstall(plugin)}
                          disabled={installingId === plugin.id}
                          className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {installingId === plugin.id ? '安装中…' : '安装'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 配置抽屉 */}
      {configPlugin && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setConfigPlugin(null)} />
          <div className="w-96 bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">⚙️ {configPlugin.name} 配置</h2>
              <button onClick={() => setConfigPlugin(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {configPlugin.configUI ? (
                <PluginWCHost
                  pluginId={configPlugin.id}
                  tagName={configPlugin.configUI}
                  scriptUrl={`/api/plugins/${configPlugin.id}/script`}
                  config={configPlugin.userConfig}
                />
              ) : (
                Object.entries(configPlugin.config?.schema || {}).map(([key, field]) =>
                  renderField(key, field)
                )
              )}
            </div>
            {!configPlugin.configUI && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                <button
                  onClick={() => setConfigPlugin(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? '保存中…' : '保存'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
