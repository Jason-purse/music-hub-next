'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

interface TocItem { id: string; label: string }

// ── 右侧快跳导航（桌面端 sticky，移动端 FAB）──────────────────────────────
export function TimelineNav({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const [mobileOpen, setMobileOpen] = useState(false)

  // 监听各节点进入视口，更新高亮
  useEffect(() => {
    if (items.length < 1) return
    const observers: IntersectionObserver[] = []

    items.forEach(item => {
      const el = document.getElementById(`tl-${item.id}`)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(item.id) },
        { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [items.map(i => i.id).join(',')])

  const handleJump = useCallback((id: string) => {
    const el = document.getElementById(`tl-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
    setMobileOpen(false)
  }, [])

  if (items.length < 2) return null

  return (
    <>
      {/* ── 桌面端：右侧 sticky 目录 ─────────────────────── */}
      <nav
        aria-label="时间轴快速跳转"
        className="hidden lg:flex flex-col gap-0.5 w-44 shrink-0 sticky top-24 self-start"
      >
        <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-2">
          快速跳转
        </div>
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              onClick={() => handleJump(item.id)}
              className={`flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-sm transition-all group
                ${active
                  ? 'text-indigo-600 bg-indigo-50 font-medium'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full transition-all
                ${active ? 'bg-indigo-500 scale-150' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'}`}
              />
              <span className="truncate leading-snug">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* ── 移动端：右下角 FAB + 弹出菜单 ───────────────── */}
      {/* 遮罩 */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <div className="lg:hidden fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
        {/* 弹出菜单 */}
        {mobileOpen && (
          <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 w-52">
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              快速跳转
            </div>
            <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    onClick={() => handleJump(item.id)}
                    className={`flex items-center gap-2 text-left px-2.5 py-2 rounded-xl text-sm transition
                      ${active ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* FAB 按钮 */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? '关闭目录' : '打开目录'}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95
            ${mobileOpen ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-[#1e1e1e] text-indigo-500 dark:text-indigo-400 border border-gray-200 dark:border-gray-700'}`}
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
