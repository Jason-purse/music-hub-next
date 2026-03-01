'use client'
import { useState, useEffect } from 'react'
import { useAdminToken } from '../../context'

const PROVIDERS = ['local', 'github', 'oss', 's3']
const PROVIDER_LABELS: Record<string, string> = {
  local: '本地存储',
  github: 'GitHub私有仓库',
  oss: '阿里云OSS',
  s3: 'AWS S3 / R2',
}

export default function StorageSettingsPage() {
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
        <h1 className="text-xl font-semibold text-gray-800">存储配置</h1>
        <p className="text-sm text-gray-400 mt-1">配置音频文件的存储服务商</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">存储服务商</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PROVIDERS.map(p => (
            <button
              key={p}
              onClick={() => setConfig((c: any) => ({ ...c, storage: { ...c.storage, provider: p } }))}
              className={`py-3 px-4 rounded-xl border-2 text-sm transition ${config.storage?.provider === p ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-medium' : 'border-gray-200 hover:border-indigo-200 text-gray-600'}`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>

        {config.storage?.provider === 'github' && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-gray-700">GitHub 配置</h3>
            {['owner', 'repo', 'branch'].map(k => (
              <div key={k} className="flex items-center gap-3">
                <label className="text-sm text-gray-500 w-20">{k}</label>
                <input
                  value={config.storage.github?.[k] || ''}
                  onChange={e => setConfig((c: any) => ({ ...c, storage: { ...c.storage, github: { ...c.storage.github, [k]: e.target.value } } }))}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            ))}
          </div>
        )}

        {config.storage?.provider === 's3' && (
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-medium text-gray-700">S3 / R2 配置</h3>
            {['endpoint', 'region', 'bucket', 'accessKeyId', 'secretAccessKey', 'cdnBase'].map(k => (
              <div key={k} className="flex items-center gap-3">
                <label className="text-sm text-gray-500 w-32">{k}</label>
                <input
                  type={k.includes('Key') || k.includes('Secret') ? 'password' : 'text'}
                  value={config.storage.s3?.[k] || ''}
                  onChange={e => setConfig((c: any) => ({ ...c, storage: { ...c.storage, s3: { ...c.storage.s3, [k]: e.target.value } } }))}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={saveConfig}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            保存配置
          </button>
          {saved && <span className="text-sm">{saved}</span>}
        </div>
      </div>
    </div>
  )
}
