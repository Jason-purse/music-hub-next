'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── 常量 ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; dot: string; icon: string }> = {
  'db-query':     { label: '本地查询', color: 'bg-indigo-50 text-indigo-700 border-indigo-200',  dot: 'bg-indigo-500',  icon: '🗄️' },
  'internal-api': { label: '内部接口', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: '⚡' },
  'http':         { label: '外部 HTTP', color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500',   icon: '🌐' },
  'static':       { label: '静态数据', color: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',    icon: '📋' },
}

const SCHEMA_LABELS: Record<string, string> = {
  'song-list':     '歌曲列表',
  'playlist-list': '歌单列表',
  'stat-numbers':  '统计数字',
  'generic-list':  '通用列表',
}

// ── 类型 ────────────────────────────────────────────────────────────────────
interface ParamDef { type: string; default: any; label: string; options?: string[] }
interface DataSource {
  id: string; name: string; description: string
  type: string; schema: string; config: any
  params: Record<string, ParamDef>; cacheTtl: number
}
interface TestState {
  status: 'idle' | 'running' | 'ok' | 'error'
  count?: number; rows?: any[]; error?: string; elapsed?: number
  testedAt?: number
}

// ── 参数表单 ────────────────────────────────────────────────────────────────
function ParamForm({ params, values, onChange }: {
  params: Record<string, ParamDef>
  values: Record<string, any>
  onChange: (k: string, v: any) => void
}) {
  const entries = Object.entries(params)
  if (!entries.length) return <p className="text-xs text-gray-400 italic">此数据源无可配置参数</p>
  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map(([key, def]) => (
        <div key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{def.label}</label>
          {def.options ? (
            <select
              value={values[key] ?? def.default}
              onChange={e => onChange(key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              {def.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : def.type === 'number' ? (
            <input
              type="number"
              value={values[key] ?? def.default}
              onChange={e => onChange(key, Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
          ) : (
            <input
              type="text"
              value={values[key] ?? def.default}
              onChange={e => onChange(key, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── 结果预览表格 ─────────────────────────────────────────────────────────────
function ResultTable({ schema, rows }: { schema: string; rows: any[] }) {
  if (!rows.length) return <p className="text-xs text-gray-400 italic py-2">返回空数据</p>

  if (schema === 'song-list') {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">#</th>
              <th className="text-left px-3 py-2 font-medium">歌曲</th>
              <th className="text-left px-3 py-2 font-medium">歌手</th>
              <th className="text-left px-3 py-2 font-medium">年代</th>
              <th className="text-right px-3 py-2 font-medium">播放</th>
              <th className="text-right px-3 py-2 font-medium">收藏</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800 max-w-[140px] truncate">{r.title}</td>
                <td className="px-3 py-2 text-gray-500">{r.artist}</td>
                <td className="px-3 py-2 text-gray-400">{r.decade || '—'}</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.play_count ?? 0}</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.like_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (schema === 'playlist-list') {
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">歌单名称</th>
              <th className="text-left px-3 py-2 font-medium">描述</th>
              <th className="text-right px-3 py-2 font-medium">歌曲数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.id || i} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{r.description || '—'}</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.song_count ?? r.songs?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // stat-numbers 或其他：key-value 网格
  return (
    <div className="grid grid-cols-3 gap-3">
      {rows.map((r, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          {Object.entries(r).filter(([k]) => k !== 'id').slice(0, 4).map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs py-0.5">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-700 font-medium">{String(v).slice(0, 20)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── 单个数据源卡片 ────────────────────────────────────────────────────────────
function DataSourceCard({ ds }: { ds: DataSource }) {
  const [expanded, setExpanded] = useState(false)
  const [paramValues, setParamValues] = useState<Record<string, any>>({})
  const [test, setTest] = useState<TestState>({ status: 'idle' })
  const tm = TYPE_META[ds.type] || TYPE_META['static']

  const runTest = useCallback(async () => {
    setTest({ status: 'running' })
    const t0 = Date.now()
    try {
      const body: any = {}
      // merge param defaults + user values
      Object.entries(ds.params || {}).forEach(([k, def]) => {
        body[k] = paramValues[k] ?? def.default
      })
      const qs = new URLSearchParams({ limit: String(body.limit || 5) })
      const res = await fetch(`/api/datasources/${ds.id}/fetch?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paramOverrides: body }),
      })
      const json = await res.json()
      const rows = Array.isArray(json.data) ? json.data : [json.data].filter(Boolean)
      setTest({ status: 'ok', count: rows.length, rows, elapsed: Date.now() - t0, testedAt: Date.now() })
    } catch (e: any) {
      setTest({ status: 'error', error: String(e), testedAt: Date.now() })
    }
  }, [ds, paramValues])

  const paramCount = Object.keys(ds.params || {}).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition hover:shadow-md">
      {/* 顶部色条 */}
      <div className={`h-1 w-full ${tm.dot}`} />

      {/* 卡片主体 */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">
            {tm.icon}
          </div>

          {/* 信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">{ds.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${tm.color}`}>
                {tm.label}
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md border border-gray-200">
                {SCHEMA_LABELS[ds.schema] || ds.schema}
              </span>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md border border-orange-100">
                缓存 {ds.cacheTtl}s
              </span>
              {paramCount > 0 && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md border border-purple-100">
                  {paramCount} 个参数
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-1.5">{ds.description}</p>

            {/* 配置摘要 */}
            <div className="mt-1.5 text-xs text-gray-400 font-mono flex items-center gap-3 flex-wrap">
              {ds.type === 'db-query' && (
                <>
                  <span>collection: <span className="text-gray-600">{ds.config.collection}</span></span>
                  {ds.config.sort && <span>sort: <span className="text-gray-600">{ds.config.sort} {ds.config.sortDir === 'desc' ? '↓' : '↑'}</span></span>}
                  {ds.config.limit && <span>limit: <span className="text-gray-600">{ds.config.limit}</span></span>}
                </>
              )}
              {ds.type === 'internal-api' && (
                <span>endpoint: <span className="text-gray-600">{ds.config.endpoint}</span></span>
              )}
              {ds.type === 'http' && (
                <span>url: <span className="text-gray-600 truncate max-w-[200px]">{ds.config.url}</span></span>
              )}
            </div>
          </div>

          {/* 操作区 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 上次测试状态 */}
            {test.status === 'ok' && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {test.count} 条 · {test.elapsed}ms
              </span>
            )}
            {test.status === 'error' && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                失败
              </span>
            )}
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              {expanded ? '收起 ▲' : '测试 ▼'}
            </button>
          </div>
        </div>

        {/* 展开：参数 + 测试 + 结果 */}
        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
            {/* 参数配置 */}
            {paramCount > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">参数配置</div>
                <ParamForm
                  params={ds.params}
                  values={paramValues}
                  onChange={(k, v) => setParamValues(prev => ({ ...prev, [k]: v }))}
                />
              </div>
            )}

            {/* 执行按钮 */}
            <button
              onClick={runTest}
              disabled={test.status === 'running'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition"
            >
              {test.status === 'running' ? (
                <><span className="animate-spin">⏳</span> 查询中…</>
              ) : (
                <><span>▶</span> 执行查询</>
              )}
            </button>

            {/* 查询结果 */}
            {test.status === 'ok' && test.rows && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    查询结果
                  </span>
                  <span className="text-xs text-emerald-600">
                    返回 {test.count} 条 · 耗时 {test.elapsed}ms
                  </span>
                </div>
                <ResultTable schema={ds.schema} rows={test.rows} />
              </div>
            )}

            {test.status === 'error' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
                ❌ {test.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 统计摘要 ─────────────────────────────────────────────────────────────────
function StatsBar({ sources }: { sources: DataSource[] }) {
  const byType = sources.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const avgTtl = sources.length ? Math.round(sources.reduce((s, d) => s + d.cacheTtl, 0) / sources.length) : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="text-xs text-gray-400 mb-1">数据源总数</div>
        <div className="text-2xl font-bold text-gray-800">{sources.length}</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="text-xs text-gray-400 mb-1">本地查询</div>
        <div className="text-2xl font-bold text-indigo-600">{byType['db-query'] || 0}</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="text-xs text-gray-400 mb-1">内部接口</div>
        <div className="text-2xl font-bold text-emerald-600">{byType['internal-api'] || 0}</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="text-xs text-gray-400 mb-1">平均缓存 TTL</div>
        <div className="text-2xl font-bold text-orange-500">{avgTtl}s</div>
      </div>
    </div>
  )
}

// ── 主页面 ───────────────────────────────────────────────────────────────────
const FILTER_OPTS = [
  { value: 'all', label: '全部' },
  { value: 'db-query', label: '🗄️ 本地查询' },
  { value: 'internal-api', label: '⚡ 内部接口' },
  { value: 'http', label: '🌐 外部 HTTP' },
  { value: 'static', label: '📋 静态数据' },
]

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/datasources')
      .then(r => r.json())
      .then(d => { setSources(d.datasources || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? sources : sources.filter(s => s.type === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition">
          ← 返回管理
        </Link>
        <span className="text-gray-200">|</span>
        <span className="text-xl">🗄️</span>
        <div>
          <h1 className="text-lg font-bold text-gray-800 leading-none">数据源中心</h1>
          <p className="text-xs text-gray-400 mt-0.5">Block 的数据从这里来，可调参测试</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">加载中…</div>
        ) : (
          <>
            <StatsBar sources={sources} />

            {/* 过滤 Tab */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm mb-6 w-fit">
              {FILTER_OPTS.map(o => {
                const count = o.value === 'all' ? sources.length : sources.filter(s => s.type === o.value).length
                if (count === 0 && o.value !== 'all') return null
                return (
                  <button
                    key={o.value}
                    onClick={() => setFilter(o.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      filter === o.value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {o.label} {count > 0 && <span className="opacity-70 ml-1">{count}</span>}
                  </button>
                )
              })}
            </div>

            {/* 数据源列表 */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">该类型下暂无数据源</div>
              ) : (
                filtered.map(ds => <DataSourceCard key={ds.id} ds={ds} />)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
