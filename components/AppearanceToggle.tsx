'use client'
import { useAppearance } from './AppearanceProvider'
import type { ColorScheme } from './AppearanceProvider'

const ICONS: Record<ColorScheme, string> = {
  light: '☀️',
  dark: '🌙',
  'eye-care': '🌿',
  system: '💻',
}
const LABELS: Record<ColorScheme, string> = {
  light: '浅色模式',
  dark: '深色模式',
  'eye-care': '护眼模式',
  system: '跟随系统',
}
const NEXT: Record<ColorScheme, ColorScheme> = {
  light: 'dark',
  dark: 'eye-care',
  'eye-care': 'system',
  system: 'light',
}

export function AppearanceToggle() {
  const { colorScheme, setColorScheme } = useAppearance()
  return (
    <button
      onClick={() => setColorScheme(NEXT[colorScheme])}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
      title={`当前：${LABELS[colorScheme]}，点击切换`}
    >
      {ICONS[colorScheme]}
    </button>
  )
}
