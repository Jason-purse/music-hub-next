'use client'
import useSWR from 'swr'

const fetcher = (url: string, body?: any) =>
  body
    ? fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    : fetch(url).then(r => r.json())

function useSongs(props: any) {
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
  const sortMap: Record<string, string> = { hot: 'play_count', liked: 'like_count', newest: 'created_at' }
  const sort = sortMap[props.source] || 'play_count'
  return useSWR(`/api/songs?sort=${sort}&limit=${props.limit || 10}`, (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false })
}

export function ChartListPreview({ props }: { props: any }) {
  const { data, isLoading } = useSongs(props)

  if (isLoading) return (
    <div className="p-4 space-y-3">
      <div className="h-5 w-32 skeleton rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
          <div className="w-8 h-8 skeleton rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 skeleton rounded w-2/3" />
            <div className="h-3 skeleton rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )

  // 兼容 DataSource 返回的 { data: [...] } 和旧 API 返回的 { songs: [...] }
  const songs = data?.data || data?.songs || []

  return (
    <div className="p-4">
      {props.title && <h2 className="font-bold text-lg mb-3 text-gray-800">{props.title}</h2>}
      <div className={props.layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {songs.slice(0, props.limit || 10).map((s: any, i: number) => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 transition">
            <span className={`w-6 text-center text-sm font-bold ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-300'}`}>{i + 1}</span>
            {s.cover_url
              ? <img src={s.cover_url} className="w-9 h-9 rounded-lg object-cover" alt="" />
              : <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-xs text-indigo-400">♪</div>
            }
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{s.title}</div>
              <div className="text-xs text-gray-400 truncate">{s.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
