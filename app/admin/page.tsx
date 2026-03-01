'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAdminToken } from './context'

export default function AdminPage() {
  const token = useAdminToken()
  const [stats, setStats] = useState<any>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [playlistCount, setPlaylistCount] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    // 歌曲总数
    fetch('/api/songs?limit=1', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(d => setStats(d))
    // 页面数
    fetch('/api/pages')
      .then(r => r.json())
      .then(d => setPageCount(Array.isArray(d) ? d.length : 0))
    // 歌单数
    fetch('/api/playlists', { headers: { 'x-admin-token': token } })
      .then(r => r.json())
      .then(d => setPlaylistCount(Array.isArray(d.playlists ?? d) ? (d.playlists ?? d).length : 0))
  }, [token])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👋 管理后台</h1>
        <p className="text-sm text-gray-400 mt-1">欢迎回来，系统运行正常</p>
      </div>

      {/* Stats 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '歌曲总数', value: stats?.total ?? '…', icon: '🎵' },
          { label: '歌单数量', value: playlistCount ?? '…', icon: '📋' },
          { label: '自定义页面', value: pageCount ?? '…', icon: '📄' },
          { label: '系统状态', value: '运行中 ✅', icon: '⚡' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-2xl font-bold text-indigo-600">{item.value}</div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">快捷入口</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: '🎵', label: '歌曲管理', desc: '添加、编辑、删除歌曲', href: '/admin/songs' },
          { icon: '📋', label: '歌单管理', desc: '创建和管理歌单', href: '/admin/playlists' },
          { icon: '🏆', label: '榜单配置', desc: '控制排行榜显示设置', href: '/admin/settings/rankings' },
          { icon: '🎨', label: '自定义页面', desc: '拖拽积木搭建自定义页面', href: '/admin/pages' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition group"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-medium text-gray-800 group-hover:text-indigo-600 transition">{item.label}</div>
            <div className="text-sm text-gray-400 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
