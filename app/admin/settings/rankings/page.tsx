'use client'
import { useState, useEffect } from 'react'
import { useAdminToken } from '../../context'

export default function RankingsSettingsPage() {
  const token = useAdminToken()
  const [rankings, setRankings] = useState<any>(null)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/settings', { headers: { 'x-admin-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRankings(d) })
  }, [token])

  async function saveRankings() {
    const r = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify(rankings),
    })
    const d = await r.json()
    setSaved(d.ok ? '✅ 保存成功' : '❌ 保存失败')
    setTimeout(() => setSaved(''), 3000)
  }

  if (!token) return <div className="p-8 text-gray-400">请先登录</div>
  if (!rankings) return <div className="p-8 text-gray-400">加载中…</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">榜单配置</h1>
        <p className="text-sm text-gray-400 mt-1">控制排行榜页各榜单的显示状态与数量</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div>
          <p className="text-xs text-gray-400">控制排行榜页面显示哪些榜单及每榜展示数量。开关关闭 = 该榜单从页面隐藏，数据不受影响。</p>
        </div>

        {/* 各榜单 */}
        {(['hot', 'liked', 'newest'] as const).map(key => {
          const chart = rankings.rankings[key]
          const labels: Record<string, string> = { hot: '🔥 热播榜', liked: '❤️ 最受欢迎', newest: '✨ 新上架' }
          const descs: Record<string, string> = { hot: '按播放次数排序', liked: '按点赞数排序', newest: '按添加时间排序' }
          return (
            <div key={key} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1">
                <div className="text-sm font-medium">{labels[key]}</div>
                <div className="text-xs text-gray-400">{descs[key]}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs ${chart.enabled ? 'text-indigo-500' : 'text-gray-300'}`}>
                  {chart.enabled ? '页面显示' : '已隐藏'}
                </span>
                <button
                  onClick={() => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, [key]: { ...chart, enabled: !chart.enabled } } }))}
                  className={`w-10 h-6 rounded-full transition shrink-0 ${chart.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${chart.enabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-gray-400">TOP</span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={chart.limit}
                  onChange={e => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, [key]: { ...chart, limit: parseInt(e.target.value) || 20 } } }))}
                  className="w-16 border rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )
        })}

        {/* 年代精选 */}
        <div className="py-3 border-b border-gray-50 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium">🎵 年代精选榜</div>
              <div className="text-xs text-gray-400">80s / 90s / 00s … 各年代分别排行</div>
            </div>
            <button
              onClick={() => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, byDecade: { ...r.rankings.byDecade, enabled: !r.rankings.byDecade.enabled } } }))}
              className={`w-10 h-6 rounded-full transition shrink-0 ${rankings.rankings.byDecade.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${rankings.rankings.byDecade.enabled ? 'translate-x-4' : ''}`} />
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-400">每榜TOP</span>
              <input
                type="number"
                min={3}
                max={50}
                value={rankings.rankings.byDecade.limitPerDecade}
                onChange={e => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, byDecade: { ...r.rankings.byDecade, limitPerDecade: parseInt(e.target.value) || 10 } } }))}
                className="w-14 border rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={saveRankings}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            保存榜单配置
          </button>
          {saved && <span className="text-sm">{saved}</span>}
        </div>
      </div>
    </div>
  )
}
