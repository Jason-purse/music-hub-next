'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AdminTokenContext } from './context'

const navSections = [
  {
    items: [{ icon: '📊', label: '概览', href: '/admin' }],
  },
  {
    title: '内容管理',
    items: [
      { icon: '🎵', label: '歌曲', href: '/admin/songs' },
      { icon: '📋', label: '歌单', href: '/admin/playlists' },
    ],
  },
  {
    title: '页面',
    items: [
      { icon: '🏠', label: '内置页面', href: '/admin/pages/built-in' },
      { icon: '🎨', label: '自定义页面', href: '/admin/pages' },
    ],
  },
  {
    title: '系统设置',
    items: [
      { icon: '🏆', label: '榜单配置', href: '/admin/settings/rankings' },
      { icon: '💾', label: '存储配置', href: '/admin/settings/storage' },
      { icon: '🔄', label: '数据迁移', href: '/admin/settings/migration' },
    ],
  },
  {
    items: [{ icon: '📄', label: '免责声明', href: '/admin/disclaimer' }],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [token, setToken] = useState('')
  const [mounted, setMounted] = useState(false)
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || ''
    setToken(t)
    setMounted(true)
  }, [])

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLogging(true)
    setLoginErr('')
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (d.token) {
        setToken(d.token)
        localStorage.setItem('admin_token', d.token)
      } else {
        setLoginErr(d.error || '登录失败，请检查密码')
      }
    } catch {
      setLoginErr('网络错误，请稍后重试')
    } finally {
      setLogging(false)
    }
  }

  if (!mounted) return null

  return (
    <AdminTokenContext.Provider value={token}>
      <div className="flex h-screen overflow-hidden">
        {/* 左侧侧边栏 */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
          {/* Logo 区域 */}
          <div className="px-4 py-5 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎶</span>
              <div>
                <div className="font-bold text-gray-800 text-sm leading-tight">MusicHub</div>
                <div className="text-[10px] text-gray-400 leading-tight">管理后台</div>
              </div>
            </div>
          </div>

          {/* 导航区域 */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.title && (
                  <div className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold px-3 mb-1">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition ${
                        isActive(item.href)
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* 底部返回链接 */}
          <div className="px-3 py-4 border-t border-gray-50">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <span>←</span>
              <span>返回前台</span>
            </Link>
          </div>
        </aside>

        {/* 右侧内容区 */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {!token ? (
            <div className="flex items-center justify-center min-h-full p-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm space-y-5">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h1 className="text-lg font-semibold text-gray-800">管理员登录</h1>
                  <p className="text-sm text-gray-400 mt-1">请输入管理员密码以继续</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
                    autoFocus
                  />
                  {loginErr && <p className="text-red-500 text-xs">{loginErr}</p>}
                  <button
                    type="submit"
                    disabled={logging}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                  >
                    {logging ? '登录中…' : '登录'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </AdminTokenContext.Provider>
  )
}
