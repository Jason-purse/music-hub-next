'use client'
import { useState, useEffect } from 'react'
import { useAdminToken } from '../../context'

type PluginApiAccess = 'public' | 'same-origin' | 'disabled'

const ACCESS_OPTIONS: { value: PluginApiAccess; label: string; desc: string }[] = [
  { value: 'public',      label: '公开',           desc: '所有来源均可调用插件 API' },
  { value: 'same-origin', label: '仅站内（同源）', desc: 'WC 插件在站内可正常调用，外部跨域请求被拒绝' },
  { value: 'disabled',    label: '关闭',           desc: '所有插件 Query / Data API 返回 403' },
]

interface Endpoint {
  method: string
  path: string
  type: string
  auth: string
  desc: string
}

const ENDPOINTS: Endpoint[] = [
  { method: 'GET',  path: '/api/plugins/[id]/script',          type: '公开', auth: '无',    desc: '插件 WC 脚本' },
  { method: 'GET',  path: '/api/plugins/[id]/config',          type: '公开', auth: '无',    desc: '插件配置（只读）' },
  { method: 'PUT',  path: '/api/plugins/[id]/config',          type: '管理', auth: 'Admin', desc: '更新插件配置' },
  { method: 'GET',  path: '/api/plugins/[id]/data',            type: '插件', auth: '受控',  desc: '插件数据存储（读）' },
  { method: 'PUT',  path: '/api/plugins/[id]/data',            type: '管理', auth: 'Admin', desc: '插件数据存储（写）' },
  { method: 'GET',  path: '/api/plugins/[id]/query/songs',     type: '插件', auth: '受控',  desc: '歌曲查询' },
  { method: 'GET',  path: '/api/plugins/[id]/query/playlists', type: '插件', auth: '受控',  desc: '歌单查询' },
  { method: 'GET',  path: '/api/plugins/[id]/query/stats',     type: '插件', auth: '受控',  desc: '��点统计' },
]

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    '公开': 'bg-green-50 text-green-700 border-green-200',
    '管理': 'bg-amber-50 text-amber-700 border-amber-200',
    '插件': 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${colors[type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {type}
    </span>
  )
}

function AuthBadge({ auth }: { auth: string }) {
  if (auth === '受控') {
    return (
      <span className="inline-block px-2 py-0.5 text-xs rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
        受控
      </span>
    )
  }
  return <span className="text-xs text-gray-500">{auth}</span>
}

export default function ApiSettingsPage() {
  const token = useAdminToken()
  const [access, setAccess] = useState<PluginApiAccess>('same-origin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setAccess(d.pluginApiAccess ?? 'same-origin')
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleSave() {
    setSaving(true)
    try {
      // 先获取完整设置，再 patch
      const cur = await fetch('/api/settings').then(r => r.json())
      const updated = { ...cur, pluginApiAccess: access }
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(updated),
      })
      const d = await r.json()
      setToast(d.ok ? '✅ 保存成功' : '❌ 保存失败')
    } catch {
      setToast('❌ 网络错误')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(''), 3000)
    }
  }

  if (!token) return <div className="p-8 text-gray-400">请先登录</div>
  if (loading) return <div className="p-8 text-gray-400">加载中…</div>

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-semibold text-gray-800">API 管理</h1>
        <p className="text-sm text-gray-400 mt-1">管理插件 API 的访问权限和查看端点清单</p>
      </div>

      {/* 访问控制设置 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">插件 API 访问控制</h2>
        <p className="text-sm text-gray-500">
          控制插件 Query / Data 读取 API 的外部访问策略。标记为「受控」的端点受此设置约束。
        </p>

        <div className="space-y-2">
          {ACCESS_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                access === opt.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-100 hover:border-indigo-200'
              }`}
            >
              <input
                type="radio"
                name="access"
                value={opt.value}
                checked={access === opt.value}
                onChange={() => setAccess(opt.value)}
                className="mt-0.5 accent-indigo-500"
              />
              <div>
                <div className={`text-sm font-medium ${access === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存设置'}
          </button>
          {toast && <span className="text-sm">{toast}</span>}
        </div>
      </div>

      {/* API 端点清单 — 桌面端表格 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">API 端点清单</h2>
        <p className="text-sm text-gray-500">
          当前系统所有插件相关 API 端点。标记为
          <AuthBadge auth="受控" />
          的端点受上方访问控制设置约束。
        </p>

        {/* 桌面端表格 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-400">
                <th className="py-2 pr-4 font-medium">端点</th>
                <th className="py-2 pr-4 font-medium w-16">类型</th>
                <th className="py-2 pr-4 font-medium w-16">Auth</th>
                <th className="py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4">
                    <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-700">
                      <span className="font-semibold text-indigo-600">{ep.method}</span>{' '}
                      {ep.path}
                    </code>
                  </td>
                  <td className="py-2.5 pr-4"><TypeBadge type={ep.type} /></td>
                  <td className="py-2.5 pr-4"><AuthBadge auth={ep.auth} /></td>
                  <td className="py-2.5 text-gray-500">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端卡片列表 */}
        <div className="md:hidden space-y-3">
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-700 break-all">
                  <span className="font-semibold text-indigo-600">{ep.method}</span>{' '}
                  {ep.path}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <TypeBadge type={ep.type} />
                <AuthBadge auth={ep.auth} />
                <span className="text-xs text-gray-400">— {ep.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
