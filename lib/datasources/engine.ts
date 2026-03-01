// DataSource 执行引擎 — 生产级缓存
// 缓存策略：
//   db-query     → unstable_cache (Next.js Data Cache，持久化磁盘，Vercel/自建均有效)
//   internal-api → fetch + next.revalidate
//   http         → fetch + next.revalidate
//   static       → 无缓存
//   invalidate   → revalidateTag(`ds-${id}`)

import { unstable_cache } from 'next/cache'
import { DataSource, DbQueryConfig, InternalApiConfig, StaticConfig, HttpConfig } from './types'

async function executeDbQueryRaw(
  config: DbQueryConfig,
  overrides: Record<string, any>
): Promise<any[]> {
  const { getDB } = await import('@/lib/db/index')
  const db = await getDB() as any

  // 展开点号 key："filter.decade" → { filter: { decade: '80s' } }
  const expanded: Record<string, any> = {}
  for (const [k, v] of Object.entries(overrides)) {
    if (k.includes('.')) {
      const [top, ...rest] = k.split('.')
      if (!expanded[top]) expanded[top] = {}
      expanded[top][rest.join('.')] = v
    } else {
      expanded[k] = v
    }
  }
  const merged = { ...overrides, ...expanded }

  const collection = config.collection || 'songs'
  let items: any[] = db[collection] || []

  // 严格过滤
  const filter = { ...config.filter, ...merged.filter }
  if (Object.keys(filter).length > 0) {
    items = items.filter((item: any) =>
      Object.entries(filter).every(([k, v]) => {
        if (v === undefined || v === null || v === '') return true
        return String(item[k]).toLowerCase() === String(v).toLowerCase()
      })
    )
  }

  // 排序
  const sort = merged.sort || config.sort
  const sortDir = merged.sortDir || config.sortDir || 'desc'
  if (sort) {
    items = [...items].sort((a, b) => {
      const av = a[sort] ?? 0; const bv = b[sort] ?? 0
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }

  // 分页
  const offset = merged.offset ?? config.offset ?? 0
  const limit = merged.limit ?? config.limit ?? 20
  return items.slice(offset, offset + limit)
}

async function executeInternalApi(
  config: InternalApiConfig,
  overrides: Record<string, any>,
  cacheTtl: number
): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:10003'
  const merged = { ...config.params, ...overrides }
  const qs = new URLSearchParams(
    Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString()
  const url = `${baseUrl}${config.endpoint}${qs ? '?' + qs : ''}`
  const res = await fetch(url, {
    method: config.method || 'GET',
    next: { revalidate: cacheTtl }, // Next.js Data Cache — 跨 serverless 实例有效
  })
  if (!res.ok) throw new Error(`internal-api ${config.endpoint} failed: ${res.status}`)
  return res.json()
}

async function executeHttp(
  config: HttpConfig,
  overrides: Record<string, any>,
  cacheTtl: number
): Promise<any> {
  const merged = { ...config.params, ...overrides }
  const qs = new URLSearchParams(
    Object.entries(merged)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  ).toString()
  const url = !config.method || config.method === 'GET'
    ? `${config.url}${qs ? '?' + qs : ''}` : config.url
  const res = await fetch(url, {
    method: config.method || 'GET',
    headers: config.headers,
    body: config.method === 'POST' ? JSON.stringify(merged) : undefined,
    next: { revalidate: cacheTtl },
  })
  if (!res.ok) throw new Error(`http ${config.url} failed: ${res.status}`)
  return res.json()
}

export async function executeDataSource(
  ds: DataSource,
  paramOverrides: Record<string, any> = {}
): Promise<{ data: any; error?: string }> {
  const ttl = ds.cacheTtl ?? 60

  try {
    let raw: any

    if (ds.type === 'db-query') {
      // unstable_cache：写入 .next/cache 磁盘，Vercel & 自建 standalone 均持久
      const cachedFn = unstable_cache(
        async (cfgStr: string, ovStr: string) =>
          executeDbQueryRaw(JSON.parse(cfgStr), JSON.parse(ovStr)),
        [`ds-${ds.id}`, JSON.stringify(paramOverrides)],
        { revalidate: ttl, tags: [`ds-${ds.id}`] }
      )
      raw = await cachedFn(JSON.stringify(ds.config), JSON.stringify(paramOverrides))

    } else if (ds.type === 'internal-api') {
      raw = await executeInternalApi(ds.config as InternalApiConfig, paramOverrides, ttl)

    } else if (ds.type === 'http') {
      raw = await executeHttp(ds.config as HttpConfig, paramOverrides, ttl)

    } else if (ds.type === 'static') {
      raw = (ds.config as StaticConfig).data || []

    } else {
      throw new Error(`未知数据源类型: ${ds.type}`)
    }

    return { data: raw }
  } catch (e: any) {
    return { data: null, error: e.message }
  }
}

// 精准清除数据源缓存（Route Handler / Server Action 中调用）
export async function invalidateDataSource(dsId: string): Promise<void> {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(`ds-${dsId}`)
}

// 兼容旧名称
export { invalidateDataSource as invalidateCache }
