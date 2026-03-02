'use client'
import { useEffect, useRef, useState } from 'react'
import { useAppearance } from './AppearanceProvider'
import type { ColorScheme } from './AppearanceProvider'

const MODES: { value: ColorScheme; icon: string; label: string }[] = [
  { value: 'light',    icon: '☀️', label: '浅色' },
  { value: 'dark',     icon: '🌙', label: '深色' },
  { value: 'eye-care', icon: '🌿', label: '护眼' },
  { value: 'system',   icon: '💻', label: '跟随系统' },
]

export function AppearanceToggle() {
  const { colorScheme, setColorScheme } = useAppearance()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const idx = MODES.findIndex(m => m.value === colorScheme)
  const current = MODES[idx] ?? MODES[3]

  // 点外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // 左侧主按钮：循环切换
  const cycle = () => {
    setColorScheme(MODES[(idx + 1) % MODES.length].value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex">
      {/* Split button 外框 */}
      <div className={`
        flex items-center rounded-full border transition-colors
        ${open
          ? 'border-indigo-300 dark:border-indigo-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
        }
        bg-white dark:bg-gray-800
      `}>
        {/* 左：主按钮，点击循环 */}
        <button
          onClick={cycle}
          title="点击切换下一个模式"
          className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-l-full"
        >
          <span className="text-base leading-none">{current.icon}</span>
          <span className="hidden sm:inline">{current.label}</span>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

        {/* 右：··· 打开下拉 */}
        <button
          onClick={() => setOpen(o => !o)}
          title="选择显示模式"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center px-2 py-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-r-full"
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* 下拉浮层 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 z-50 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <ul role="listbox">
            {MODES.map(mode => {
              const active = mode.value === colorScheme
              return (
                <li key={mode.value} role="option" aria-selected={active}>
                  <button
                    onClick={() => { setColorScheme(mode.value); setOpen(false) }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                      ${active
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <span className="w-5 text-center">{mode.icon}</span>
                    <span className="flex-1">{mode.label}</span>
                    {active && (
                      <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
