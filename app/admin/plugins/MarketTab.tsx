'use client'
import { useEffect, useState, useCallback } from 'react'

/* ---------- types ---------- */
interface MarketPlugin {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  tags?: string[]
  registryUrl?: string
  registryName?: string
  installed?: boolean
  hasUpdate?: boolean
}

interface Registry {
  id: string
  name: string
  url: string
  enabled: boolean
  removable?: boolean
}

/* ---------- Skeleton ---------- */
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
      </div>
    </div>
  )
}

/* ---------- Plugin Card ---------- */
function PluginMarketCard({ plugin, onInstall }: {
  plugin: MarketPlugin
  onInstall: (plugin: MarketPlugin) => Promise<void>
}) {
  const [installing, setInstalling] = useState(false)
  const [done, setDone] = useState(plugin.installed ?? false)

  const handleInstall = async () => {
    setInstalling(true)
    await onInstall(plugin)
    setInstalling(false)
    setDone(true)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{plugin.name}</span>
            <span className="text-xs text-gray-400">v{plugin.version}</span>
            {plugin.registryName && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                {plugin.registryName}
              </span>
            )}
          </div>
          {plugin.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plugin.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {plugin.author && (
              <span className="text-xs text-gray-400">by {plugin.author}</span>
            )}
            {(plugin.tags || []).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0">
          {plugin.hasUpdate && !done ? (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-60"
            >
              {installing ? '更新中…' : '更新'}
            </button>
          ) : done && !plugin.hasUpdate ? (
            <button
              disabled
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
            >
              已安装
            </button>
          ) : (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-60"
            >
              {installing ? '安装中…' : '安装'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Registry Panel ---------- */
function RegistryPanel() {
  const [registries, setRegistries] = useState<Registry[]>([])
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchRegistries = useCallback(async () => {
    try {
      const res = await fetch('/api/plugins/registries')
      if (res.ok) {
        const data = await res.json()
        setRegistries(data.registries || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { fetchRegistries() }, [fetchRegistries])

  const handleToggle = async (reg: Registry) => {
    const res = await fetch(`/api/plugins/registries/${reg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !reg.enabled }),
    })
    if (res.ok) {
      setRegistries(prev => prev.map(r => r.id === reg.id ? { ...r, enabled: !r.enabled } : r))
    }
  }

  const handleDelete = async (reg: Registry) => {
    if (!confirm(`确认删除注册表「${reg.name}」？`)) return
    const res = await fetch(`/api/plugins/registries/${reg.id}`, { method: 'DELETE' })
    if (res.ok) {
      setRegistries(prev => prev.filter(r => r.id !== reg.id))
    }
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newUrl.trim()) return
    setAdding(true)
    const res = await fetch('/api/plugins/registries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), url: newUrl.trim() }),
    })
    if (res.ok) {
      setNewName('')
      setNewUrl('')
      await fetchRegistries()
    }
    setAdding(false)
  }

  return (
    <div className="mt-10 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
      >
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">🗂 注册表管理</span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-800">
          {registries.length === 0 && (
            <p className="text-sm text-gray-400">暂无注册表</p>
          )}
          {registries.map(reg => (
            <div key={reg.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{reg.name}</div>
                <div className="text-xs text-gray-400 truncate">{reg.url}</div>
              </div>
              <button
                onClick={() => handleToggle(reg)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${reg.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${reg.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              {reg.removable !== false && (
                <button
                  onClick={() => handleDelete(reg)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  删除
                </button>
              )}
            </div>
          ))}

          <div className="pt-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">添加注册表</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="名称"
                className="w-28 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
              />
              <input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim() || !newUrl.trim()}
                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {adding ? '添加中…' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Main export ---------- */
export default function MarketTab() {
  const [plugins, setPlugins] = useState<MarketPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const fetchMarket = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/plugins/market')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error as string)
      setPlugins(data.plugins || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMarket() }, [fetchMarket])

  const handleInstall = async (plugin: MarketPlugin) => {
    const res = await fetch('/api/plugins/market/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plugin.id, registryUrl: plugin.registryUrl }),
    })
    if (res.ok) {
      showToast(`✅ 已安装 ${plugin.name}`)
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, installed: true, hasUpdate: false } : p))
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string }
      showToast(`❌ ${err.error || '安装失败'}`)
    }
  }

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded-xl text-sm font-medium border shadow-lg ${
          toast.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {toast}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-3">插件市场暂时不可用</p>
          <button
            onClick={fetchMarket}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {plugins.length === 0 ? (
            <div className="text-center text-gray-400 py-16">插件市场暂无插件</div>
          ) : (
            <div className="space-y-3">
              {plugins.map(p => (
                <PluginMarketCard key={p.id} plugin={p} onInstall={handleInstall} />
              ))}
            </div>
          )}
          <RegistryPanel />
        </>
      )}
    </div>
  )
}
