'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AdminTokenContext } from './context'

interface NavChild {
  icon: string
  label: string
  href: string
}

interface NavItem {
  icon: string
  label: string
  href: string
  children?: NavChild[]
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const CORE_NAV: NavSection[] = [
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
    title: '模块',
    items: [
      {
        icon: '🏠', label: '内置模块', href: '/admin/pages/built-in',
        children: [
          { icon: '🏆', label: '榜单配置', href: '/admin/settings/rankings' },
        ],
      },
      { icon: '🎨', label: '自定义模块', href: '/admin/pages' },
    ],
  },
  {
    title: '系统设置',
    items: [
      { icon: '🧩', label: '插件管理', href: '/admin/plugins' },
      { icon: '💾', label: '存储配置', href: '/admin/settings/storage' },
      { icon: '🔄', label: '数据迁移', href: '/admin/settings/migration' },
      { icon: '🔌', label: 'API 管理', href: '/admin/settings/api' },
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
  collapsed,
  onToggleCollapse,
}: {
  pluginMenuItems: PluginMenuItem[]
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const navSections = buildNavSections(pluginMenuItems)
  const isCollapsed = collapsed ?? false

  // Compute initial expanded state: auto-expand parent if current path matches a child
  const computeInitialExpanded = (): Record<string, boolean> => {
    const initial: Record<string, boolean> = {}
    for (const section of navSections) {
      for (const item of section.items) {
        if (item.children) {
          const childActive = item.children.some(
            c => pathname === c.href || pathname.startsWith(c.href + '/')
          )
          if (childActive) initial[item.href] = true
        }
      }
    }
    return initial
  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>(computeInitialExpanded)

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    if (href === '/admin/pages') {
      return pathname === '/admin/pages' ||
        (pathname.startsWith('/admin/pages/') && !pathname.startsWith('/admin/pages/built-in'))
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  function toggleExpanded(href: string) {
    setExpanded(prev => ({ ...prev, [href]: !prev[href] }))
  }

  const linkClass = (active: boolean, collapsedMode: boolean) =>
    `flex items-center ${collapsedMode ? 'justify-center px-0' : 'gap-3 px-3'} py-2 text-sm rounded-lg transition ${
      active
        ? 'bg-indigo-50 dark:bg-[var(--music-accent-light)] text-indigo-600 dark:text-[var(--music-accent)] font-medium'
        : 'text-gray-600 dark:text-[var(--music-text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--music-surface-hover)]'
    }`

  return (
    <aside className={`${isCollapsed ? 'w-14' : 'w-56'} transition-[width] duration-200 ease-in-out h-full bg-white dark:bg-[var(--music-surface)] border-r border-gray-100 dark:border-[var(--music-border)] flex flex-col overflow-hidden relative group/sidebar`}>
      {/* 浮动折叠/展开按钮 — 右边缘，始终可见，对标 Notion/Linear */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          className="hidden md:flex absolute -right-3 top-16 z-50 items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-[var(--music-surface)] border border-gray-200 dark:border-[var(--music-border)] shadow-sm text-gray-400 hover:text-indigo-500 hover:border-indigo-300 hover:shadow-md transition-all duration-150"
        >
          <svg className="w-3 h-3 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isCollapsed
              ? <path d="M9 18l6-6-6-6" />
              : <path d="M15 18l-6-6 6-6" />
            }
          </svg>
        </button>
      )}
      {/* 返回前台 — 顶部，始终可见 */}
      <Link
        href="/"
        onClick={onClose}
        title="返回前台"
        className={`flex items-center ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-1.5 px-4 py-2'} text-xs text-gray-400 dark:text-[var(--music-text-subtle)] hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-[var(--music-accent-light)] transition border-b border-gray-50 dark:border-[var(--music-border)]`}
      >
        <span>←</span>
        {!isCollapsed && <span>返回前台</span>}
      </Link>

      {/* Logo 区 */}
      <div className={`px-4 py-4 border-b border-gray-50 dark:border-[var(--music-border)] flex items-center ${isCollapsed ? 'justify-center gap-1' : 'justify-between'}`}>
        {isCollapsed ? (
          <>
            <span className="text-xl">🎶</span>

          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎶</span>
              <div>
                <div className="font-bold text-gray-800 dark:text-[var(--music-text)] text-sm leading-tight">MusicHub</div>
                <div className="text-[10px] text-gray-400 dark:text-[var(--music-text-subtle)] leading-tight">管理后台</div>
              </div>
            </div>
            <div className="flex items-center gap-1">

              {onClose && (
                <button onClick={onClose} className="md:hidden p-1 text-gray-400 dark:text-[var(--music-text-subtle)] hover:text-gray-600 dark:hover:text-[var(--music-text-muted)]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, si) => (
          <div key={si}>
            {!isCollapsed && 'title' in section && section.title && (
              <div className="text-[10px] uppercase tracking-widest text-gray-300 dark:text-[var(--music-text-subtle)] font-semibold px-3 mb-1">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const hasChildren = !!(item.children && item.children.length > 0)
                const isOpen = !!expanded[item.href]

                return (
                  <div key={item.href}>
                    {/* Parent item */}
                    <Link
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      onClick={() => {
                        if (!isCollapsed && hasChildren) toggleExpanded(item.href)
                        else onClose?.()
                      }}
                      className={linkClass(isActive(item.href), isCollapsed)}
                    >
                      <span>{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {hasChildren && (
                            <span className="text-xs text-gray-400 dark:text-[var(--music-text-subtle)]">
                              {isOpen ? '▾' : '▸'}
                            </span>
                          )}
                        </>
                      )}
                    </Link>

                    {/* Children — only in expanded mode */}
                    {!isCollapsed && hasChildren && isOpen && (
                      <div className="mt-0.5 ml-3 pl-3 border-l-2 border-gray-100 dark:border-[var(--music-border)] space-y-0.5">
                        {item.children!.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={linkClass(isActive(child.href), false)}
                          >
                            <span>{child.icon}</span>
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>


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
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || ''
    setToken(t)
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    // 进入页面编辑器时强制折叠
    if (pathname.includes('/edit')) {
      setCollapsed(true)
    } else {
      setCollapsed(saved === 'true')
    }
    setMounted(true)
  }, [pathname])

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('admin-sidebar-collapsed', String(next))
  }

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
      <div className="flex h-screen overflow-hidden bg-[var(--music-bg)] text-[var(--music-text)]">
        {/* 桌面端固定侧边栏 */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            pluginMenuItems={pluginMenuItems}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
          />
        </div>

        {/* 移动端遮罩 */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* 移动端抽屉 — 始终展开，不传 collapsed */}
        <div className={`
          fixed inset-y-0 left-0 z-50 md:hidden flex
          transform transition-transform duration-250
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar pluginMenuItems={pluginMenuItems} onClose={() => setDrawerOpen(false)} />
        </div>

        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[var(--music-bg-secondary)] flex flex-col min-w-0">
          {/* 移动端顶部栏 */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[var(--music-surface)] border-b border-gray-100 dark:border-[var(--music-border)] shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-gray-500 dark:text-[var(--music-text-muted)] hover:text-gray-700 dark:hover:text-[var(--music-text)] hover:bg-gray-100 dark:hover:bg-[var(--music-surface-hover)] rounded-lg"
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
              <span className="font-semibold text-gray-800 dark:text-[var(--music-text)] text-sm">MusicHub 管理后台</span>
            </div>
          </div>

          {!token ? (
            <div className="flex items-center justify-center flex-1 p-6">
              <div className="bg-white dark:bg-[var(--music-surface)] rounded-2xl shadow-sm border border-gray-100 dark:border-[var(--music-border)] p-8 w-full max-w-sm space-y-5">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔐</div>
                  <h1 className="text-lg font-semibold text-gray-800 dark:text-[var(--music-text)]">管理员登录</h1>
                  <p className="text-sm text-gray-400 dark:text-[var(--music-text-subtle)] mt-1">请输入管理员密码以继续</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="w-full border border-gray-200 dark:border-[var(--music-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-[var(--music-accent)] focus:border-indigo-300 dark:focus:border-[var(--music-accent)] bg-white dark:bg-[var(--music-bg)] text-gray-900 dark:text-[var(--music-text)] placeholder:text-gray-400 dark:placeholder:text-[var(--music-text-subtle)]"
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
