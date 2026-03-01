'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PluginItem {
  id: string
  name: string
  description: string
  version: string
  author: string
  tags?: string[]
  builtIn?: boolean
  installed?: boolean
  layoutOption?: { icon: string; label: string; value: string }
}

export default function PluginsPage() {
  const [tab, setTab] = useState<'market' | 'installed'>('market')
  const [data, setData] = useState<{ installed: PluginItem[]; market: PluginItem[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [installing, setInstalling] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  async function fetchData() {
    const res = await fetch('/api/plugins')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleInstall(pluginId: string) {
    setInstalling(pluginId)
    const res = await fetch('/api/plugins/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId })
    })
    if (res.ok) {
      setToast('✅ 安装成功！前往页面编辑器选择新布局')
      setTimeout(() => setToast(''), 4000)
      await fetchData()
    } else {
      const err = await res.json()
      setToast(`❌ ${err.error || '安装失败，请重试'}`)
      setTimeout(() => setToast(''), 3000)
    }
    setInstalling(null)
  }

  async function handleUninstall(pluginId: string) {
    setInstalling(pluginId)
    const res = await fetch('/api/plugins/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId, action: 'uninstall' })
    })
    if (res.ok) {
      setToast('✅ 已卸载')
      setTimeout(() => setToast(''), 3000)
      await fetchData()
    } else {
      setToast('❌ 卸载失败')
      setTimeout(() => setToast(''), 3000)
    }
    setInstalling(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1">
          ← 返回管理
        </Link>
        <h1 className="text-xl font-bold text-gray-800">🧩 插件市场</h1>
        {toast && (
          <div className={`ml-auto px-4 py-2 rounded-xl text-sm font-medium border ${
            toast.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>{toast}</div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('market')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${tab === 'market' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200'}`}>
            🌐 发现布局插件
          </button>
          <button onClick={() => setTab('installed')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${tab === 'installed' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200'}`}>
            ✅ 已安装 ({data?.installed.length ?? 0})
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">加载中…</div>
        )}

        {/* 市场 Tab */}
        {!loading && tab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.market ?? []).map(plugin => (
              <div key={plugin.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-indigo-50">
                    {plugin.layoutOption?.icon ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{plugin.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">by {plugin.author} · v{plugin.version}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">{plugin.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(plugin.tags ?? []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-xs">{tag}</span>
                    ))}
                  </div>
                  <button
                    disabled={!!plugin.installed || installing === plugin.id}
                    onClick={() => handleInstall(plugin.id)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition shrink-0 ${
                      plugin.installed ? 'bg-gray-100 text-gray-400 cursor-default'
                      : installing === plugin.id ? 'bg-indigo-100 text-indigo-400 cursor-wait'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                    }`}>
                    {plugin.installed ? '已安装' : installing === plugin.id ? '安装中…' : '安装'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 已安装 Tab */}
        {!loading && tab === 'installed' && (
          <div className="space-y-3">
            {(data?.installed ?? []).map(plugin => (
              <div key={plugin.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center text-xl shrink-0 border border-indigo-100">
                  {plugin.layoutOption?.icon ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    {plugin.name}
                    {plugin.builtIn && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-md font-normal">内置</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{plugin.description}</div>
                </div>
                {plugin.builtIn ? (
                  <span className="text-xs text-gray-300">不可卸载</span>
                ) : (
                  <button onClick={() => handleUninstall(plugin.id)} disabled={installing === plugin.id} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">{installing === plugin.id ? '卸载中…' : '卸载'}</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
