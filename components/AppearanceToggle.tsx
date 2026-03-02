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

// ── 少 (≤2)：行内 pill ─────────────────────────────────────────────────────

function InlinePills() {
  const { colorScheme, setColorScheme } = useAppearance()
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
      {MODES.map(mode => {
        const active = mode.value === colorScheme
        return (
          <button
            key={mode.value}
            onClick={() => setColorScheme(mode.value)}
            title={mode.label}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded-full text-sm transition-all duration-150
              ${active
                ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `}
          >
            <span>{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── 多 (>2)：toggle 按钮 + 下拉浮层 ──────────────────────────────────────

function DropdownPicker() {
  const { colorScheme, setColorScheme } = useAppearance()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = MODES.find(m => m.value === colorScheme) ?? MODES[3]

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {/* Toggle 按钮 */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium select-none
          border transition-all duration-150
          ${open
            ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg
          className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

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

export function AppearanceToggle() {
  return MODES.length <= 2 ? <InlinePills /> : <DropdownPicker />
}
