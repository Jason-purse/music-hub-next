import React from 'react'
import { BlockPlugin } from '../types'

interface HeroBannerProps {
  title: string
  subtitle: string
  bgColor: string
  textColor: string
}

function HeroBannerComponent({ props }: { props: HeroBannerProps }) {
  const { title = '欢迎来到 MusicHub', subtitle = '发现你喜爱的音乐', bgColor = '#6366f1', textColor = '#ffffff' } = props
  return (
    <div
      className="w-full py-16 px-6 flex flex-col items-center justify-center text-center rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${bgColor}, ${bgColor}cc)`,
        color: textColor,
      }}
    >
      <h2 className="text-4xl font-bold mb-3 leading-tight">{title}</h2>
      {subtitle && <p className="text-lg opacity-90 max-w-xl">{subtitle}</p>}
    </div>
  )
}

export const HeroBannerBlock: BlockPlugin<HeroBannerProps> = {
  type: 'hero-banner',
  label: '横幅广告',
  icon: '🖼️',
  defaultProps: {
    title: '欢迎来到 MusicHub',
    subtitle: '发现你喜爱的音乐',
    bgColor: '#6366f1',
    textColor: '#ffffff',
  },
  fields: [
    { name: 'title',     label: '标题',   type: 'text' },
    { name: 'subtitle',  label: '副标题', type: 'text' },
    { name: 'bgColor',   label: '背景色', type: 'color' },
    { name: 'textColor', label: '文字色', type: 'color' },
  ],
  Component: HeroBannerComponent,
}
