'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AdminTokenContext } from './context'

const CORE_NAV = [
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
      { icon: '🏆', label: '榜单配置', href: '/admin/settings/rankings' },
    ],
  },
  {
    title: '系统设置',
    items: [
      { icon: '🧩', label: '插件管理', href: '/admin/plugins' },
      { icon: '💾', label: '存储配置', href: '/admin/settings/storage' },
      { icon: '🔄', label: '数据迁移', href: '/admin/settings/migration' },
    ],
  },
  {
    items: [{ icon: '📄', label: '免责声明', href: '/admin/disclaimer' }],
  },
]

interface PluginMenuItem {
  icon: string
  label: string
  href: string
}

interface Props {
  children: React.ReactNode
  /** 来自 Server Component 的插件菜单项 */
  pluginMenuItems?: PluginMenuItem[]
}

function buildNavSections(pluginMenuItems: PluginMenuItem[]) {
  const sections = [...CORE_NAV]
  if (pluginMenuItems.length > 0) {
    sections.splice(-1, 0, {
      title: '插件功能',
      items: pluginMenuItems,
    })
  }
  return sections
}

function Sidebar({
  pluginMenuItems,
  onClose,
}: {
  pluginMenuItems: PluginMenuItem[]
  onClose?: () => void
}) {
  const pathname = usePathname()
  const navSections = buildNavSections(pluginMenuItems)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    // /admin/pages 不能匹配 /admin/pages/built-in（内置页面是独立路由）
    if (href === '/admin/pages') {
      return pathname === '/admin/pages' ||
        (pathname.startsWith('/admin/pages/') && !pathname.startsWith('/admin/pages/built-in'))
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-56 h-full bg-white border-r border-gray-100 flex flex-col overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎶</span>
          <div>
            <div className="font-bold text-gray-800 text-sm leading-tight">MusicHub</div>
            <div className="text-[10px] text-gray-400 leading-tight">管理后台</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, si) => (
          <div key={si}>
            {'title' in section && section.title && (
              <div className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold px-3 mb-1">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
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

      <div className="px-3 py-4 border-t border-gray-50">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <span>←</span>
          <span>返回前台</span>
        </Link>
      </div>
    </aside>
  )
}

export function AdminLayoutClient({ children, pluginMenuItems = [] }: Props) {
  const [token, setToken] = useState('')
  const [mounted, setMounted] = useState(false)
  const [password, setPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [logging, setLogging] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || ''
    setToken(t)
    setMounted(true)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLogging(true)
    setLoginErr('')
    try {
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
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
        {/* 桌面端固定侧边栏 */}
        <div className="hidden md:flex shrink-0">
          <Sidebar pluginMenuItems={pluginMenuItems} />
        </div>

        {/* 移动端遮罩 */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* 移动端抽屉 */}
        <div className={`
          fixed inset-y-0 left-0 z-50 md:hidden flex
          transform transition-transform duration-250
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar pluginMenuItems={pluginMenuItems} onClose={() => setDrawerOpen(false)} />
        </div>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col min-w-0">
          {/* 移动端顶部栏 */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              aria-label="打开菜单"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span>🎶</span>
              <span className="font-semibold text-gray-800 text-sm">MusicHub 管理后台</span>
            </div>
          </div>

          {!token ? (
            <div className="flex items-center justify-center flex-1 p-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm space-y-5">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h1 className="text-lg font-semibold text-gray-800">管理员登录</h1>
                  <p className="text-sm text-gray-400 mt-1">请输入管理员���码以继续</p>
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
