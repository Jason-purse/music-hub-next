'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type ColorScheme = 'light' | 'dark' | 'system'

const AppearanceContext = createContext<{
  colorScheme: ColorScheme
  setColorScheme: (t: ColorScheme) => void
  resolved: 'light' | 'dark'
}>({ colorScheme: 'system', setColorScheme: () => {}, resolved: 'light' })

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // 读 localStorage
    const saved = localStorage.getItem('music-color-scheme') as ColorScheme | null
    if (saved) setColorSchemeState(saved)
  }, [])

  useEffect(() => {
    const applyScheme = (t: ColorScheme) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = t === 'dark' || (t === 'system' && prefersDark)
      document.documentElement.classList.toggle('dark', isDark)
      setResolved(isDark ? 'dark' : 'light')
    }

    applyScheme(colorScheme)
    localStorage.setItem('music-color-scheme', colorScheme)

    // 监听系统变化（仅 system 模式下生效）
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => { if (colorScheme === 'system') applyScheme('system') }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [colorScheme])

  const setColorScheme = (t: ColorScheme) => setColorSchemeState(t)

  return (
    <AppearanceContext.Provider value={{ colorScheme, setColorScheme, resolved }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export const useAppearance = () => useContext(AppearanceContext)
