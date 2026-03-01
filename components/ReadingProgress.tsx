'use client'
import { useEffect, useState } from 'react'

interface Props {
  color?: string
  height?: number
}

export function ReadingProgress({ color = '#6366f1', height = 3 }: Props) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const calc = () => {
      const el = document.documentElement
      const scrollTop = window.scrollY || el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      setProgress(scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', calc, { passive: true })
    calc()
    return () => window.removeEventListener('scroll', calc)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: `${height}px`,
        background: color,
        zIndex: 9999,
        transition: 'width 0.1s ease',
        borderRadius: '0 2px 2px 0',
      }}
    />
  )
}
