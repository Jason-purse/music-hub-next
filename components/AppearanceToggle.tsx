'use client'
import { useAppearance } from './AppearanceProvider'

export function AppearanceToggle() {
  const { resolved, setColorScheme } = useAppearance()

  const toggle = () => {
    if (resolved === 'light') setColorScheme('dark')
    else setColorScheme('light')
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={resolved === 'dark' ? '切换浅色' : '切换深色'}
    >
      {resolved === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
