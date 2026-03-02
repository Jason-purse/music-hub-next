'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PageItem {
  id: string
  slug: string
  title: string
  layout: string
  published: boolean
  createdAt: number
  updatedAt: number
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    setLoading(true)
    try {
      const res = await fetch('/api/pages')
      if (res.ok) setPages(await res.json())
    } catch (e) {}
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    const slug = newSlug.trim() || newTitle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), slug, layout: 'single-col', slots: { main: [] } }),
    })
    if (res.ok) {
      const page = await res.json()
      setPages(prev => [...prev, page])
      setNewTitle('')
      setNewSlug('')
      setShowCreate(false)
      setMessage('✅ 页面已创建')
    } else {
      setMessage('❌ 创建失败')
    }
    setCreating(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`确���删除页面「${title}」吗？`)) return
    const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPages(prev => prev.filter(p => p.id !== id))
      setMessage('✅ 页面已删除')
    } else {
      setMessage('❌ 删除失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleTogglePublish(page: PageItem) {
    const res = await fetch(`/api/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...page, published: !page.published }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPages(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }

  const layoutLabels: Record<string, string> = {
    'single-col': '单列',
    'two-col-sidebar': '双栏',
    'hero-then-content': 'Hero+内容',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-xl text-gray-800">🎨 自定义模块</h1>
          <p className="text-sm text-gray-400 mt-0.5">通过拖拽积木块自由搭建自定义模块</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + 新建页面
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-2xl">🎨</span>
        <div>
          <div className="font-medium text-indigo-800">自定义页面</div>
          <div className="text-sm text-indigo-600">通过拖拽积木块自由搭建自定义模块，访问路径为 /pages/[slug]</div>
        </div>
      </div>

      <div className="space-y-4">
        {message && (
          <div className="text-sm px-4 py-2 bg-white rounded-lg border border-gray-100 shadow-sm">
            {message}
          </div>
        )}

        {/* 新建表单 */}
        {showCreate && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold mb-4">新建页面</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">页面标题</label>
                  <input
                    value={newTitle}
                    onChange={e => {
                      setNewTitle(e.target.value)
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''))
                      }
                    }}
                    placeholder="首页横幅"
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">URL Slug（自动生成）</label>
                  <input
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value)}
                    placeholder="home-banner"
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {creating ? '创建中…' : '创建'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="text-gray-500 hover:text-gray-700 px-5 py-2 rounded-lg text-sm"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 页面列表 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中…</div>
          ) : pages.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📄</div>
              <div>暂无页面，点击右上角「新建页面」</div>
            </div>
          ) : (
            <>
              {/* 移动端卡片列表 */}
              <div className="sm:hidden divide-y divide-gray-50">
                {pages.map(page => (
                  <div key={page.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800">{page.title}</span>
                      <button
                        onClick={() => handleTogglePublish(page)}
                        className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium transition ${
                          page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {page.published ? '已发布' : '草稿'}
                      </button>
                    </div>
                    <a
                      href={`/pages/${page.slug}`}
                      target="_blank"
                      className="block text-xs text-gray-400 font-mono hover:text-indigo-500 truncate"
                    >
                      /pages/{page.slug}
                    </a>
                    <div className="flex items-center gap-3 pt-0.5">
                      <span className="text-xs text-gray-400">{layoutLabels[page.layout] || page.layout}</span>
                      <Link href={`/admin/pages/${page.id}/edit`} className="text-xs text-indigo-500 hover:underline">编辑</Link>
                      <button onClick={() => handleDelete(page.id, page.title)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 桌面端表格 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">标题</th>
                      <th className="text-left px-4 py-3 font-medium">Slug</th>
                      <th className="text-left px-4 py-3 font-medium">布局</th>
                      <th className="text-left px-4 py-3 font-medium">状态</th>
                      <th className="text-left px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map(page => (
                      <tr key={page.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{page.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          <a href={`/pages/${page.slug}`} target="_blank" className="hover:text-indigo-500 hover:underline">
                            /pages/{page.slug}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{layoutLabels[page.layout] || page.layout}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleTogglePublish(page)}
                            className={`text-xs px-2 py-1 rounded-full font-medium transition ${
                              page.published
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {page.published ? '已发布' : '草稿'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/pages/${page.id}/edit`} className="text-sm text-indigo-500 hover:underline">编辑</Link>
                            <button onClick={() => handleDelete(page.id, page.title)} className="text-sm text-red-400 hover:text-red-600">删除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

