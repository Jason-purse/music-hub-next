'use client'
import Link from 'next/link'

const BUILT_IN_PAGES = [
  {
    icon: '🏠',
    name: '首页',
    path: '/',
    desc: '主页，展示热门内容与横幅',
    configs: [
      { label: '榜单配置', href: '/admin/settings/rankings', desc: '控制首页显示哪些榜单及条目数量' },
    ],
  },
  {
    icon: '🔍',
    name: '发现',
    path: '/discover',
    desc: '音乐发现页，年代分类浏览',
    configs: [],
  },
  {
    icon: '🏆',
    name: '排行榜',
    path: '/rankings',
    desc: '热播、点赞、新上架等多维榜单',
    configs: [
      { label: '榜单配置', href: '/admin/settings/rankings', desc: '控制显示哪些榜单、TOP N 数量、开关可见性' },
    ],
  },
  {
    icon: '📋',
    name: '歌单',
    path: '/playlists',
    desc: '所有歌单列表页',
    configs: [
      { label: '歌单管理', href: '/admin/playlists', desc: '添加、编辑、排序歌单' },
    ],
  },
  {
    icon: '🔎',
    name: '搜索',
    path: '/search',
    desc: '全站搜索',
    configs: [],
  },
]

export default function BuiltInPagesPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">🏠 内置模块</h1>
        <p className="text-sm text-gray-400 mt-1">系统内置的功能模块，结构由代码定义，可通过配置调整展示内容</p>
      </div>

      <div className="space-y-3">
        {BUILT_IN_PAGES.map(page => (
          <div
            key={page.path}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 md:p-5 flex items-center gap-4">
              <div className="text-2xl md:text-3xl shrink-0">{page.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{page.name}</div>
                <div className="text-sm text-gray-400 mt-0.5">{page.desc}</div>
                <div className="text-xs text-gray-300 font-mono mt-1">{page.path}</div>
              </div>
              <a
                href={page.path}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                预览
              </a>
            </div>

            {page.configs.length > 0 && (
              <div className="border-t border-gray-50 bg-gray-50/50 px-4 md:px-5 py-3 flex flex-col sm:flex-row gap-2">
                {page.configs.map(cfg => (
                  <Link
                    key={cfg.href}
                    href={cfg.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">{cfg.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{cfg.desc}</div>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-400 shrink-0">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
