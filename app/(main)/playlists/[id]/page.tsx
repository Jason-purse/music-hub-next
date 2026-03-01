import { notFound } from 'next/navigation'
import { getDB } from '@/lib/db/index'
import { getSongById } from '@/lib/github-db'
import SongList from '@/components/SongList'
import Link from 'next/link'

export const revalidate = 60

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const db = await getDB()
  const playlist = db.playlists?.find(p => p.id === params.id)
  return { title: playlist ? `${playlist.name} - MusicHub` : '歌单' }
}

export default async function PlaylistDetailPage({ params }: Props) {
  const db = await getDB()
  const playlist = db.playlists?.find(p => p.id === params.id)
  if (!playlist) notFound()

  // 获取歌单内的歌曲（song_ids 关联）
  const songIds: string[] = playlist.song_ids || []
  const songs = (await Promise.all(songIds.map(id => getSongById(id)))).filter(Boolean) as any[]

  return (
    <div className="space-y-6">
      {/* 歌单头部 */}
      <div className="flex gap-6 items-end">
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-5xl">🎵</span>
        </div>
        <div className="flex-1 min-w-0 pb-2">
          <div className="text-xs text-gray-400 mb-1">歌单</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{playlist.description}</p>
          )}
          <div className="text-sm text-gray-400">{songs.length} 首歌曲</div>
        </div>
      </div>

      {/* 歌曲列表 */}
      {songs.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">歌曲列表</h2>
          <SongList songs={songs} />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <div className="text-4xl mb-3">🎼</div>
          <div>暂无歌曲</div>
          <Link href="/playlists" className="text-indigo-400 text-sm mt-2 inline-block hover:underline">← 返回歌单列表</Link>
        </div>
      )}
    </div>
  )
}
