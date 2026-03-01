'use client'
import { useState, useEffect } from 'react'
import { useAdminToken } from '../context'

export default function DisclaimerPage() {
  const token = useAdminToken()
  const [config, setConfig] = useState<any>(null)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/admin', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setConfig(d) })
  }, [token])

  async function saveConfig() {
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ action: 'update', ...config }),
    })
    const d = await r.json()
    setSaved(d.ok ? '✅ 保存成功' : '❌ 保存失败')
    setTimeout(() => setSaved(''), 3000)
  }

  if (!token) return <div className="p-8 text-gray-400">请先登录</div>
  if (!config) return <div className="p-8 text-gray-400">加载中…</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">免责声明</h1>
        <p className="text-sm text-gray-400 mt-1">配置网站免责声明弹窗与联系方式</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">免责声明配置</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">首次访问弹窗</label>
          <button
            onClick={() => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, showOnFirstVisit: !c.disclaimer?.showOnFirstVisit } }))}
            className={`w-12 h-6 rounded-full transition ${config.disclaimer?.showOnFirstVisit ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${config.disclaimer?.showOnFirstVisit ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <div>
          <label className="text-sm text-gray-700 block mb-2">声明文案</label>
          <textarea
            rows={6}
            value={config.disclaimer?.text || ''}
            onChange={e => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, text: e.target.value } }))}
            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 w-24">投诉邮箱</label>
          <input
            value={config.disclaimer?.contactEmail || ''}
            onChange={e => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, contactEmail: e.target.value } }))}
            className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveConfig}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            保存
          </button>
          {saved && <span className="text-sm">{saved}</span>}
        </div>
      </div>
    </div>
  )
}
