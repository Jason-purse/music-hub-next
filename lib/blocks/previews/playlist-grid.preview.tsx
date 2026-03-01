'use client'
import useSWR from 'swr'

const fetcher = (url: string, body?: any) =>
  body
    ? fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())
    : fetch(url).then(r => r.json())

function usePlaylists(props: any) {
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
  return useSWR(`/api/playlists?limit=${props.limit || 6}`, (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false })
}

export function PlaylistGridPreview({ props }: { props: any }) {
  const cols = Number(props.columns) || 3
  const { data, isLoading } = usePlaylists(props)
  
  // 兼容 DataSource 返回的 { data: [...] } 和旧 API 返回的 { playlists: [...] }
  const playlists = data?.data || data?.playlists || []

  if (isLoading) return (
    <div className="p-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="aspect-square skeleton rounded-xl" />
      ))}
    </div>
  )

  return (
    <div className="p-4">
      {props.title && <h2 className="font-bold text-lg mb-3 text-gray-800">{props.title}</h2>}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {playlists.map((p: any) => (
          <div key={p.id} className="aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-end p-3 relative overflow-hidden">
            <div className="text-white">
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs opacity-75">{p.songs?.length || 0}首</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
