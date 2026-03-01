'use client'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme()

  const toggle = () => {
    if (resolved === 'light') setTheme('dark')
    else setTheme('light')
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
