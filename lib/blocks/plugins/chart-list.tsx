import React from 'react'
import { BlockPlugin } from '../types'
import { getSongs } from '@/lib/db'
import SongList from '@/components/SongList'

interface ChartListProps {
  source: 'hot' | 'liked' | 'newest'
  layout: 'list' | 'grid'
  limit: number
  title: string
}

async function ChartListComponent({ props }: { props: ChartListProps }) {
  const { source = 'hot', limit = 10, title = '热播榜单', layout = 'list' } = props
  const sortMap: Record<string, string> = {
    hot: 'play_count',
    liked: 'like_count',
    newest: 'created_at',
  }

  let songs: any[] = []
  try {
    const result = await getSongs({ sort: sortMap[source] || 'play_count', limit: limit || 10 })
    songs = result.songs
  } catch (e) {
    console.error('[ChartList] getSongs error:', e)
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      <SongList songs={songs} showRank={true} />
    </div>
  )
}

export const ChartListBlock: BlockPlugin<ChartListProps> = {
  type: 'chart-list',
  label: '榜单卡',
  icon: '📊',
  defaultProps: {
    source: 'hot',
    layout: 'list',
    limit: 10,
    title: '热播榜单',
  },
  fields: [
    { name: 'title', label: '标题', type: 'text' },
    {
      name: 'source',
      label: '数据来源',
      type: 'select',
      options: [
        { label: '热播榜', value: 'hot' },
        { label: '最受欢迎', value: 'liked' },
        { label: '最新上架', value: 'newest' },
      ],
    },
    {
      name: 'layout',
      label: '展示方式',
      type: 'select',
      options: [
        { label: '列表', value: 'list' },
        { label: '网格', value: 'grid' },
      ],
    },
    { name: 'limit', label: '显示数量', type: 'number', defaultValue: 10 },
  ],
  Component: ChartListComponent as any,
}
