'use client'
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
  const current = MODES.find(m => m.value === colorScheme) ?? MODES[3]

  return (
    <div className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
      {/* 图标 — 当前模式状态指示 */}
      <span className="text-base leading-none select-none">{current.icon}</span>

      {/* suffix 选择器 — 原生 select，移动端用系统 picker */}
      <select
        value={colorScheme}
        onChange={e => setColorScheme(e.target.value as ColorScheme)}
        className="
          text-sm text-gray-700 dark:text-gray-300
          bg-transparent border-none outline-none cursor-pointer
          pr-1 appearance-none
          focus:ring-0
        "
        aria-label="选择显示模式"
      >
        {MODES.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  )
}
