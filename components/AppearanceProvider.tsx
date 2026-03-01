'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ColorScheme = 'light' | 'dark' | 'eye-care' | 'system'
export type ResolvedScheme = 'light' | 'dark' | 'eye-care'

interface AppearanceCtx {
  colorScheme: ColorScheme
  setColorScheme: (s: ColorScheme) => void
  resolved: ResolvedScheme
}

const AppearanceContext = createContext<AppearanceCtx>({
  colorScheme: 'system',
  setColorScheme: () => {},
  resolved: 'light',
})

function applyScheme(scheme: ColorScheme): ResolvedScheme {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  let resolved: ResolvedScheme

  if (scheme === 'system') {
    resolved = prefersDark ? 'dark' : 'light'
  } else {
    resolved = scheme as ResolvedScheme
  }

  // 清除所有模式 class，再加当前的
  document.documentElement.classList.remove('dark', 'eye-care')
  if (resolved === 'dark') document.documentElement.classList.add('dark')
  if (resolved === 'eye-care') document.documentElement.classList.add('eye-care')

  // dispatch 自定义事件，WC 插件可监听
  window.dispatchEvent(new CustomEvent('colorscheme:change', {
    detail: { scheme, resolved }
  }))

  return resolved
}

function persistScheme(scheme: ColorScheme) {
  // 双写：localStorage（客户端快速读）+ cookie（SSR 零 flash）
  localStorage.setItem('music-color-scheme', scheme)
  document.cookie = `music-color-scheme=${scheme}; path=/; max-age=31536000; SameSite=Lax`
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system')
  const [resolved, setResolved] = useState<ResolvedScheme>('light')

  useEffect(() => {
    const saved = (localStorage.getItem('music-color-scheme') as ColorScheme) || 'system'
    setColorSchemeState(saved)
    setResolved(applyScheme(saved))
  }, [])

  useEffect(() => {
    if (colorScheme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => setResolved(applyScheme('system'))
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [colorScheme])

  const setColorScheme = (s: ColorScheme) => {
    setColorSchemeState(s)
    const r = applyScheme(s)
    setResolved(r)
    persistScheme(s)
  }

  return (
    <AppearanceContext.Provider value={{ colorScheme, setColorScheme, resolved }}>
      {children}
    </AppearanceContext.Provider>
  )
}

export const useAppearance = () => useContext(AppearanceContext)
