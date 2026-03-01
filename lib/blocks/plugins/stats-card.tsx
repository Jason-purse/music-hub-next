import React from 'react'
import { BlockPlugin } from '../types'
import { getDB } from '@/lib/db'

interface StatsCardProps {
  title: string
  showSongs: boolean
  showPlaylists: boolean
  showDecades: boolean
}

async function StatsCardComponent({ props }: { props: StatsCardProps }) {
  const {
    title = '站点统计',
    showSongs = true,
    showPlaylists = true,
    showDecades = true,
  } = props

  let songCount = 0
  let playlistCount = 0
  let decadeCount = 0

  try {
    const db = await getDB()
    songCount = db.songs?.length || 0
    playlistCount = db.playlists?.length || 0
    const decades = new Set(db.songs?.map((s: any) => s.decade).filter(Boolean))
    decadeCount = decades.size
  } catch (e) {
    console.error('[StatsCard] error:', e)
  }

  const items = [
    showSongs && { label: '歌曲总数', value: songCount, icon: '🎵', color: 'text-indigo-600' },
    showPlaylists && { label: '歌单数量', value: playlistCount, icon: '🎶', color: 'text-purple-600' },
    showDecades && { label: '年代跨度', value: `${decadeCount} 个年代`, icon: '⏰', color: 'text-pink-600' },
  ].filter(Boolean) as { label: string; value: any; icon: string; color: string }[]

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '1rem' }}>
        {items.map(item => (
          <div key={item.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="text-2xl">{item.icon}</div>
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 col-span-3">未选择任何统计项</div>
        )}
      </div>
    </div>
  )
}

export const StatsCardBlock: BlockPlugin<StatsCardProps> = {
  type: 'stats-card',
  label: '统计卡片',
  icon: '📈',
  defaultProps: {
    title: '站点统计',
    showSongs: true,
    showPlaylists: true,
    showDecades: true,
  },
  fields: [
    { name: 'title', label: '标题', type: 'text' },
    { name: 'showSongs', label: '显示歌曲数', type: 'switch', defaultValue: true },
    { name: 'showPlaylists', label: '显示歌单数', type: 'switch', defaultValue: true },
    { name: 'showDecades', label: '显示年代跨度', type: 'switch', defaultValue: true },
  ],
  Component: StatsCardComponent as any,
}
