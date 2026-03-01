'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { InstalledPlugin, PluginConfigField } from '@/types/plugin'

interface PluginWithConfig extends InstalledPlugin {
  userConfig: Record<string, unknown>
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginWithConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [configPlugin, setConfigPlugin] = useState<PluginWithConfig | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

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

  async function handleToggle(plugin: PluginWithConfig) {
    if (plugin.builtin) return
    const res = await fetch(`/api/plugins/${plugin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !plugin.enabled }),
    })
    if (res.ok) {
      showToast(plugin.enabled ? '✅ 已禁用' : '✅ 已启用')
      await fetchPlugins()
    }
  }

  async function handleDelete(plugin: PluginWithConfig) {
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

  function openConfig(plugin: PluginWithConfig) {
    setConfigPlugin(plugin)
    // seed form values from userConfig or schema defaults
    const schema = plugin.config?.schema || {}
    const initial: Record<string, unknown> = {}
    for (const [key, field] of Object.entries(schema)) {
      initial[key] = plugin.userConfig[key] ?? field.default
    }
    setConfigValues(initial)
  }

  async function saveConfig() {
    if (!configPlugin) return
    setSaving(true)
    const token = localStorage.getItem('admin-token') || ''
    const res = await fetch(`/api/plugins/${configPlugin.id}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(configValues),
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

  function renderField(key: string, field: PluginConfigField) {
    const value = configValues[key]
    const onChange = (v: unknown) => setConfigValues(prev => ({ ...prev, [key]: v }))

    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        {field.description && (
          <p className="text-xs text-gray-400 mb-1">{field.description}</p>
        )}
        {field.type === 'select' && (
          <select
            value={String(value ?? field.default ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
        {field.type === 'text' && (
          <input
            type="text"
            value={String(value ?? field.default ?? '')}
            onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
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
        {field.type === 'toggle' && (
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          />
        )}
      </div>
    )
  }

  const categoryLabel: Record<string, string> = {
    appearance: '外观', theme: '主题', player: '播放器', feature: '功能', source: '音源',
  }

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

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">加载中…</div>
        )}

        {!loading && (
          <div className="space-y-4">
            {plugins.map(plugin => (
              <div key={plugin.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{plugin.name}</span>
                      {plugin.builtin && (
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md">内置</span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                        {categoryLabel[plugin.category] || plugin.category}
                      </span>
                      <span className="text-xs text-gray-400">v{plugin.version}</span>
                      <span className="text-xs text-gray-400">priority={plugin.priority}</span>
                    </div>
                    {plugin.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plugin.description}</p>
                    )}
                  </div>

                  {/* 操作区 */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* 启用/禁用 toggle */}
                    <button
                      onClick={() => handleToggle(plugin)}
                      disabled={!!plugin.builtin}
                      title={plugin.builtin ? '内置插件始终启用' : plugin.enabled ? '点击禁用' : '点击启用'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        plugin.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      } ${plugin.builtin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${plugin.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>

                    {/* 配置按钮 */}
                    {plugin.config?.schema && Object.keys(plugin.config.schema).length > 0 && (
                      <button
                        onClick={() => openConfig(plugin)}
                        className="px-3 py-1.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        配置
                      </button>
                    )}

                    {/* 卸载 */}
                    {!plugin.builtin && (
                      <button
                        onClick={() => handleDelete(plugin)}
                        className="px-3 py-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        卸载
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {plugins.length === 0 && (
              <div className="text-center py-20 text-gray-400">暂无已安装插件</div>
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
              {Object.entries(configPlugin.config?.schema || {}).map(([key, field]) =>
                renderField(key, field)
              )}
            </div>
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
          </div>
        </div>
      )}
    </div>
  )
}
