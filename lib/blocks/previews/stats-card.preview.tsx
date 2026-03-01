'use client'
import useSWR from 'swr'

const fetcher = (url: string, body?: any) =>
  body
    ? fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    : fetch(url).then(r => r.json())

function useStats(props: any) {
  // 有 dataSourceId：走 DataSource API
  if (props.dataSourceId) {
    const paramOverrides: Record<string, any> = {}
    if (props.limit) paramOverrides.limit = props.limit
    return useSWR(
      [`/api/datasources/${props.dataSourceId}/fetch`, paramOverrides],
      ([url, body]) => fetcher(url, { paramOverrides: body }),
      { revalidateOnFocus: false }
    )
  }
  // fallback：老的硬编码
  const { data: songsData } = useSWR('/api/songs?limit=1', fetcher)
  const { data: playlistsData } = useSWR('/api/playlists?limit=1', fetcher)
  
  return {
    data: {
      songs: songsData?.total || 0,
      playlists: playlistsData?.total || 0,
    },
    isLoading: !songsData || !playlistsData
  }
}

export function StatsCardPreview({ props }: { props: any }) {
  const { data, isLoading } = useStats(props)

  // 兼容 DataSource 返回的 { data: [...] } 和 fallback 的 { songs, playlists }
  const total = data?.data?.[0]?.total ?? data?.songs ?? 0
  const playlists = data?.data?.[1]?.total ?? data?.playlists ?? 0

  const stats = [
    props.showSongs !== false && { icon: '🎵', value: total, label: '歌曲总数' },
    props.showPlaylists !== false && { icon: '📋', value: playlists, label: '歌单数量' },
    props.showDecades !== false && { icon: '🕐', value: 5, label: '年代跨度' },
  ].filter(Boolean) as Array<{ icon: string; value: number; label: string }>

  if (isLoading) return (
    <div className="p-4">
      {props.title && <h2 className="font-bold text-lg mb-3 text-gray-800">{props.title}</h2>}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="h-8 skeleton rounded mb-2" />
            <div className="h-4 skeleton rounded w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-4">
      {props.title && <h2 className="font-bold text-lg mb-3 text-gray-800">{props.title}</h2>}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-indigo-600">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
