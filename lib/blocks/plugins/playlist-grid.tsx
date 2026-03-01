import React from 'react'
import { BlockPlugin } from '../types'
import { getPlaylists } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'

interface PlaylistGridProps {
  limit: number
  columns: number
  title: string
}

async function PlaylistGridComponent({ props }: { props: PlaylistGridProps }) {
  const { limit = 8, columns = 4, title = '精选歌单' } = props

  let playlists: any[] = []
  try {
    const all = await getPlaylists()
    playlists = all.slice(0, limit || 8)
  } catch (e) {
    console.error('[PlaylistGrid] error:', e)
  }

  const colClass: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }
  const gridClass = colClass[columns] || colClass[4]

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>}
      {playlists.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-600">暂无歌单</div>
      ) : (
        <div className={`grid ${gridClass} gap-4`}>
          {playlists.map(pl => (
            <Link
              key={pl.id}
              href={`/playlist/${pl.id}`}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none overflow-hidden hover:shadow-md dark:hover:border-gray-700 transition group"
            >
              <div className="aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 relative">
                {pl.cover_url && (
                  <Image src={pl.cover_url} alt={pl.name} fill className="object-cover" unoptimized />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                  <span className="text-white text-3xl opacity-50 group-hover:opacity-100 transition">▶</span>
                </div>
              </div>
              <div className="p-3">
                <div className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{pl.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {pl.song_count ?? pl.song_ids?.length ?? 0} 首歌曲
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export const PlaylistGridBlock: BlockPlugin<PlaylistGridProps> = {
  type: 'playlist-grid',
  label: '歌单网格',
  icon: '🎶',
  defaultProps: {
    limit: 8,
    columns: 4,
    title: '精选歌单',
  },
  fields: [
    { name: 'title', label: '标题', type: 'text' },
    { name: 'limit', label: '显示数量', type: 'number', defaultValue: 8 },
    {
      name: 'columns',
      label: '列数',
      type: 'select',
      options: [
        { label: '2列', value: '2' },
        { label: '3列', value: '3' },
        { label: '4列', value: '4' },
      ],
    },
  ],
  Component: PlaylistGridComponent as any,
}
