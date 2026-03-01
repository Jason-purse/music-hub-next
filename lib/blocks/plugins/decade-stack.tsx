import React from 'react'
import { BlockPlugin } from '../types'
import { getSongs } from '@/lib/db'
import SongList from '@/components/SongList'

interface DecadeStackProps {
  decades: string[]
  title: string
  cardHeight: number
}

async function DecadeStackComponent({ props }: { props: DecadeStackProps }) {
  const { decades = ['80s', '90s', '00s', '10s', '20s'], title = '年代精选', cardHeight = 320 } = props

  const decadeList = Array.isArray(decades) ? decades : ['80s', '90s', '00s', '10s', '20s']
  const decadeLabelMap: Record<string, string> = {
    '80s': '🎸 80年代',
    '90s': '💿 90年代',
    '00s': '🎵 00年代',
    '10s': '🎧 10年代',
    '20s': '🔥 20年代',
  }

  let decadeData: { decade: string; songs: any[] }[] = []
  try {
    decadeData = await Promise.all(
      decadeList.map(async (d) => {
        const db = await import('@/lib/db').then(m => m.getDB())
        const songs = db.songs
          .filter((s: any) => s.decade === d)
          .sort((a: any, b: any) => b.play_count - a.play_count)
          .slice(0, 10)
        return { decade: d, songs }
      })
    )
  } catch (e) {
    console.error('[DecadeStack] error:', e)
  }

  const validData = decadeData.filter(d => d.songs.length > 0)

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">{title}</h3>}
      <div className="space-y-4">
        {validData.map(({ decade, songs }, idx) => (
          <div
            key={decade}
            className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden"
            style={{
              top: `${idx * 8}px`,
              zIndex: idx,
              minHeight: cardHeight ? `${cardHeight}px` : undefined,
            }}
          >
            <div className="px-5 pt-5 pb-3 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
              <span className="text-xl">{decadeLabelMap[decade] || decade}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{songs.length} 首</span>
            </div>
            <div className="px-2 pb-2">
              <SongList songs={songs} showRank={true} />
            </div>
          </div>
        ))}
        {validData.length === 0 && (
          <div className="text-center py-12 text-gray-300 dark:text-gray-600">暂无年代数据</div>
        )}
      </div>
    </div>
  )
}

export const DecadeStackBlock: BlockPlugin<DecadeStackProps> = {
  type: 'decade-stack',
  label: '年代堆叠',
  icon: '🎵',
  defaultProps: {
    decades: ['80s', '90s', '00s', '10s', '20s'],
    title: '年代精选',
    cardHeight: 320,
  },
  fields: [
    { name: 'title', label: '标题', type: 'text' },
    {
      name: 'decades',
      label: '展示年代（支持多选：80s, 90s, 00s, 10s, 20s）',
      type: 'select',
      options: [
        { label: '80年代', value: '80s' },
        { label: '90年代', value: '90s' },
        { label: '00年代', value: '00s' },
        { label: '10年代', value: '10s' },
        { label: '20年代', value: '20s' },
      ],
    },
    { name: 'cardHeight', label: '卡片高度(px)', type: 'number', defaultValue: 320 },
  ],
  Component: DecadeStackComponent as any,
}
