'use client'
import { useState } from 'react'
import { useAdminToken } from '../../context'

export default function MigrationSettingsPage() {
  const token = useAdminToken()
  const [migrating, setMigrating] = useState(false)
  const [migrateLog, setMigrateLog] = useState('')

  if (!token) return <div className="p-8 text-gray-400">请先登录</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">数据迁移</h1>
        <p className="text-sm text-gray-400 mt-1">将音频文件在不同存储之间迁移</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold">存储迁移</h2>
        <p className="text-sm text-gray-500">将音频文件从一个存储迁移到另一个存储，期间网站正常访问。</p>
        <div className="flex gap-4 flex-wrap">
          {['local→github', 'local→s3', 'github→s3', 's3→local'].map(route => (
            <button
              key={route}
              disabled={migrating}
              onClick={async () => {
                const [from, to] = route.split('→')
                setMigrating(true)
                setMigrateLog(`开始迁移 ${from} → ${to}...\n`)
                const r = await fetch('/api/admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                  body: JSON.stringify({ action: 'migrate', from, to }),
                })
                const d = await r.json()
                setMigrateLog(prev => prev + (d.message || JSON.stringify(d)) + '\n')
                setMigrating(false)
              }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-indigo-300 transition disabled:opacity-50"
            >
              {route}
            </button>
          ))}
        </div>
        {migrateLog && (
          <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap text-gray-600 max-h-48 overflow-auto">
            {migrateLog}
          </pre>
        )}
      </div>
    </div>
  )
}
