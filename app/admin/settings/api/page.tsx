'use client'
import { useState, useEffect, useCallback } from 'react'

type PluginApiAccess = 'public' | 'same-origin' | 'disabled'
type FilterTab = 'all' | 'public' | 'admin' | 'controlled'

interface Param {
  name: string
  type: string
  required: boolean
  desc: string
  defaultValue?: string
  options?: string[]
}

interface Endpoint {
  method: 'GET' | 'PUT' | 'DELETE' | 'POST'
  path: string
  access: 'public' | 'admin' | 'controlled'
  auth: 'none' | 'admin-token'
  desc: string
  params: Param[]
  bodyParams?: Param[]
  responseExample: string
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/plugins/[id]/script', access: 'public', auth: 'none', desc: '获取插件 WC 脚本（JS 文件）', params: [], responseExample: '// JavaScript Web Component 代码' },
  { method: 'GET', path: '/api/plugins/[id]/config', access: 'public', auth: 'none', desc: '获取插件配置（schema + userConfig）', params: [], responseExample: '{"id":"hello-plugin","schema":{},"userConfig":{}}' },
  { method: 'PUT', path: '/api/plugins/[id]/config', access: 'admin', auth: 'admin-token', desc: '更新插件用户配置', params: [], bodyParams: [{ name: 'body', type: 'json', required: true, desc: '配置 JSON 对象' }], responseExample: '{"success":true}' },
  { method: 'GET', path: '/api/plugins/[id]/data', access: 'controlled', auth: 'none', desc: '读取插件 KV 数据存储（全部键值对）', params: [], responseExample: '{"key1":"value1","key2":"value2"}' },
  { method: 'PUT', path: '/api/plugins/[id]/data', access: 'admin', auth: 'admin-token', desc: '写入插件 KV 数据', params: [], bodyParams: [{ name: 'key', type: 'string', required: true, desc: '键名' }, { name: 'value', type: 'string', required: true, desc: '值' }], responseExample: '{"success":true}' },
  { method: 'DELETE', path: '/api/plugins/[id]/data/[key]', access: 'admin', auth: 'admin-token', desc: '删除指定 KV 键', params: [{ name: 'key', type: 'string', required: true, desc: '要删除的键名（URL 路径参数）' }], responseExample: '{"success":true}' },
  { method: 'GET', path: '/api/plugins/[id]/query/songs', access: 'controlled', auth: 'none', desc: '查询歌曲列表（受访问控制策略约束）', params: [{ name: 'limit', type: 'number', required: false, desc: '返回数量', defaultValue: '10' }, { name: 'sort', type: 'enum', required: false, desc: '排序方式', options: ['plays', 'newest', 'likes'] }, { name: 'decade', type: 'string', required: false, desc: '年代过滤（如 80s）' }], responseExample: '[{"id":1,"title":"大约在冬季","artist":"齐秦","play_count":1234}]' },
  { method: 'GET', path: '/api/plugins/[id]/query/playlists', access: 'controlled', auth: 'none', desc: '查询歌单列表', params: [{ name: 'limit', type: 'number', required: false, desc: '返回数量', defaultValue: '10' }], responseExample: '[{"id":"p1","title":"80年代经典回忆"}]' },
  { method: 'GET', path: '/api/plugins/[id]/query/stats', access: 'controlled', auth: 'none', desc: '获取站点统计数据', params: [], responseExample: '{"songs":66,"playlists":2,"plays":12500}' },
  { method: 'GET', path: '/api/plugins/blocks', access: 'public', auth: 'none', desc: '获取所有已启用插件声明的积木块列表', params: [], responseExample: '[{"type":"hello-stats-card","label":"站点统计","pluginId":"hello-plugin"}]' },
]

const METHOD_COLOR: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  PUT: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  POST: 'bg-blue-100 text-blue-700',
}
const ACCESS_BADGE: Record<string, string> = {
  public: 'bg-gray-100 text-gray-500',
  admin: 'bg-amber-100 text-amber-700',
  controlled: 'bg-indigo-100 text-indigo-600',
}
const ACCESS_LABEL: Record<string, string> = { public: '公开', admin: '管理', controlled: '受控' }

const STATUS_COLOR = (s: number) => s >= 200 && s < 300 ? 'text-emerald-600' : s >= 400 && s < 500 ? 'text-amber-600' : 'text-red-600'

export default function ApiManagePage() {
  const [access, setAccess] = useState<PluginApiAccess>('same-origin')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [selected, setSelected] = useState<Endpoint | null>(ENDPOINTS[6])
  const [pluginId, setPluginId] = useState('hello-plugin')
  const [params, setParams] = useState<Record<string, string>>({})
  const [bodyJson, setBodyJson] = useState('{}')
  const [adminToken, setAdminToken] = useState('')
  const [sending, setSending] = useState(false)
  const [response, setResponse] = useState<{ status: number; time: number; body: string } | null>(null)
  const [showExample, setShowExample] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.pluginApiAccess) setAccess(d.pluginApiAccess)
    }).catch(() => {})
    const t = localStorage.getItem('admin-token') || ''
    setAdminToken(t)
  }, [])

  useEffect(() => {
    setParams({})
    setBodyJson('{}')
    setResponse(null)
    setShowExample(false)
  }, [selected])

  const saveAccess = useCallback(async (val: PluginApiAccess) => {
    setAccess(val)
    setSaving(true)
    try {
      await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }, body: JSON.stringify({ pluginApiAccess: val }) })
    } catch {}
    setSaving(false)
  }, [adminToken])

  const buildUrl = useCallback((ep: Endpoint) => {
    let url = ep.path.replace('[id]', pluginId)
    if (ep.path.includes('[key]') && params['key']) url = url.replace('[key]', params['key'])
    const qs = ep.params.filter(p => params[p.name]).map(p => `${p.name}=${encodeURIComponent(params[p.name])}`).join('&')
    return qs ? `${url}?${qs}` : url
  }, [pluginId, params])

  const sendRequest = async () => {
    if (!selected) return
    setSending(true)
    setResponse(null)
    const url = buildUrl(selected)
    const headers: Record<string, string> = {}
    if (selected.auth === 'admin-token' && adminToken) headers['x-admin-token'] = adminToken
    let body: string | undefined
    if (selected.method !== 'GET' && selected.method !== 'DELETE') {
      headers['Content-Type'] = 'application/json'
      if (selected.bodyParams?.some(p => p.type === 'json')) {
        body = bodyJson
      } else {
        const obj: Record<string, string> = {}
        selected.bodyParams?.forEach(p => { if (params[`body_${p.name}`]) obj[p.name] = params[`body_${p.name}`] })
        body = JSON.stringify(obj)
      }
    }
    const t0 = Date.now()
    try {
      const res = await fetch(url, { method: selected.method, headers, body })
      const time = Date.now() - t0
      let text = await res.text()
      try { text = JSON.stringify(JSON.parse(text), null, 2) } catch {}
      setResponse({ status: res.status, time, body: text })
    } catch (e) {
      setResponse({ status: 0, time: Date.now() - t0, body: String(e) })
    }
    setSending(false)
  }

  const copyUrl = () => {
    if (!selected) return
    navigator.clipboard.writeText(window.location.origin + buildUrl(selected))
    setCopied('url'); setTimeout(() => setCopied(''), 1500)
  }

  const copyCurl = () => {
    if (!selected) return
    const url = window.location.origin + buildUrl(selected)
    const h = selected.auth === 'admin-token' && adminToken ? ` -H "x-admin-token: ${adminToken}"` : ''
    const b = selected.method !== 'GET' && selected.method !== 'DELETE' ? ` -H "Content-Type: application/json" -d '${bodyJson}'` : ''
    navigator.clipboard.writeText(`curl -X ${selected.method} "${url}"${h}${b}`)
    setCopied('curl'); setTimeout(() => setCopied(''), 1500)
  }

  const filtered = filter === 'all' ? ENDPOINTS : ENDPOINTS.filter(e => e.access === filter)
  const accessStatus = { public: { color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500', label: '公开访问' }, 'same-origin': { color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-500', label: '仅站内' }, disabled: { color: 'text-red-600 bg-red-50', dot: 'bg-red-500', label: '已关闭' } }[access]

  return (
    <div className="h-full flex flex-col">
      {/* 页头 */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">🔌 API 管理</h1>
          <p className="text-xs text-gray-400 mt-0.5">管理插件 API 访问权限，在线测试各端点</p>
        </div>
        {/* 全局访问控制 */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${accessStatus.dot}`} />
          <span className="text-xs text-gray-500">访问策略：</span>
          <select
            value={access}
            onChange={e => saveAccess(e.target.value as PluginApiAccess)}
            className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="public">公开</option>
            <option value="same-origin">仅站内（同源）</option>
            <option value="disabled">关闭</option>
          </select>
          {saving && <span className="text-xs text-gray-400 animate-pulse">保存中…</span>}
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* 左栏 */}
        <div className="lg:w-2/5 border-r border-gray-100 flex flex-col overflow-hidden">
          {/* 过滤 Tab */}
          <div className="flex border-b border-gray-100 px-2 pt-2 gap-1">
            {(['all', 'public', 'admin', 'controlled'] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition ${filter === t ? 'bg-white border border-b-white border-gray-200 text-indigo-600 -mb-px' : 'text-gray-400 hover:text-gray-600'}`}>
                {t === 'all' ? '全部' : t === 'public' ? '公开' : t === 'admin' ? '管理' : '受控'}
                <span className="ml-1 text-[10px] text-gray-300">({(t === 'all' ? ENDPOINTS : ENDPOINTS.filter(e => e.access === t)).length})</span>
              </button>
            ))}
          </div>

          {/* 端点列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filtered.map((ep, i) => (
              <button key={i} onClick={() => setSelected(ep)} className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${selected === ep ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${ACCESS_BADGE[ep.access]}`}>{ACCESS_LABEL[ep.access]}</span>
                </div>
                <div className="text-xs font-mono text-gray-600 truncate">{ep.path}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 truncate">{ep.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 右栏 */}
        {selected ? (
          <div className="lg:w-3/5 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 端点头 */}
              <div className="flex items-start gap-3">
                <span className={`text-sm font-bold px-2 py-1 rounded shrink-0 ${METHOD_COLOR[selected.method]}`}>{selected.method}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-gray-800 break-all">{selected.path}</div>
                  <div className="text-xs text-gray-500 mt-1">{selected.desc}</div>
                </div>
              </div>

              {/* 参数文档 */}
              {(selected.params.length > 0 || (selected.bodyParams && selected.bodyParams.length > 0)) && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-gray-500 mb-2">参数</div>
                  <div className="space-y-1">
                    {[...selected.params, ...(selected.bodyParams || [])].map(p => (
                      <div key={p.name} className="flex items-center gap-2 text-xs">
                        <code className="font-mono text-indigo-600 shrink-0">{p.name}</code>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">{p.type}</span>
                        {p.required && <span className="text-red-400 text-[10px]">必填</span>}
                        <span className="text-gray-400 flex-1 truncate">{p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 响应示例 */}
              <div>
                <button onClick={() => setShowExample(!showExample)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  {showExample ? '▾' : '▸'} 响应示例
                </button>
                {showExample && (
                  <pre className="mt-2 bg-gray-900 text-gray-100 rounded-xl p-3 text-xs overflow-x-auto">{selected.responseExample}</pre>
                )}
              </div>

              {/* 测试面板 */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="text-xs font-semibold text-gray-600">🧪 在线测试</div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Plugin ID */}
                  {selected.path.includes('[id]') && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Plugin ID</label>
                      <input value={pluginId} onChange={e => setPluginId(e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-indigo-200" placeholder="hello-plugin" />
                    </div>
                  )}

                  {/* Query 参数 */}
                  {selected.params.map(p => (
                    <div key={p.name}>
                      <label className="text-xs text-gray-500 block mb-1">{p.name}{p.required && <span className="text-red-400 ml-1">*</span>}</label>
                      {p.type === 'enum' && p.options ? (
                        <select value={params[p.name] || ''} onChange={e => setParams(prev => ({...prev, [p.name]: e.target.value}))} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200">
                          <option value="">默认</option>
                          {p.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={params[p.name] || ''} onChange={e => setParams(prev => ({...prev, [p.name]: e.target.value}))} placeholder={p.defaultValue || p.desc} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200" />
                      )}
                    </div>
                  ))}

                  {/* Body 参数 */}
                  {selected.bodyParams?.map(p => (
                    <div key={p.name}>
                      <label className="text-xs text-gray-500 block mb-1">{p.name}{p.required && <span className="text-red-400 ml-1">*</span>}</label>
                      {p.type === 'json' ? (
                        <textarea value={bodyJson} onChange={e => setBodyJson(e.target.value)} rows={4} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
                      ) : (
                        <input value={params[`body_${p.name}`] || ''} onChange={e => setParams(prev => ({...prev, [`body_${p.name}`]: e.target.value}))} placeholder={p.desc} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200" />
                      )}
                    </div>
                  ))}

                  {/* Admin Token */}
                  {selected.auth === 'admin-token' && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Admin Token</label>
                      <input type="password" value={adminToken} onChange={e => setAdminToken(e.target.value)} placeholder="从 localStorage 自动读取" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
                    </div>
                  )}

                  {/* 发送按钮 */}
                  <button onClick={sendRequest} disabled={sending} className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition">
                    {sending ? '发送中…' : '▶ 发送请求'}
                  </button>

                  {/* 响应 */}
                  {response && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${STATUS_COLOR(response.status)}`}>{response.status === 0 ? 'ERROR' : response.status}</span>
                        <span className="text-xs text-gray-400">{response.time}ms</span>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">{response.body}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部工具栏 */}
            <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
              <button onClick={copyUrl} className="flex-1 text-xs border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition text-gray-600">
                {copied === 'url' ? '✅ 已复制' : '📋 复制 URL'}
              </button>
              <button onClick={copyCurl} className="flex-1 text-xs border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition text-gray-600">
                {copied === 'curl' ? '✅ 已复制' : '⌨️ 复制为 cURL'}
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:w-3/5 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <div className="text-4xl mb-2">🔌</div>
              <div className="text-sm">选择左侧端点查看详情</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
