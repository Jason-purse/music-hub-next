'use client'
import { useEffect, useState } from 'react'

interface Props {
  threshold?: number
}

export function BackToTop({ threshold = 0 }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const scrollToTop = () => {
    // 用 instant 而不是 smooth：能打断正在进行的滚动动画，立即生效
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="回到顶部"
      title="回到顶部"
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-indigo-500 dark:bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:scale-110 transition-all duration-200 opacity-90 hover:opacity-100"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  )
}
