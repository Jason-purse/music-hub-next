'use client'
import Link from 'next/link'

const BUILT_IN_PAGES = [
  { icon: '🏠', name: '首页', path: '/', desc: '主页，展示热门内容与横幅', configHref: '/admin/settings/rankings' },
  { icon: '🔍', name: '发现', path: '/discover', desc: '音乐发现页，年代分类浏览', configHref: null },
  { icon: '🏆', name: '排行榜', path: '/rankings', desc: '热播、点赞、新上架等多维榜单', configHref: '/admin/settings/rankings' },
  { icon: '📋', name: '歌单', path: '/playlists', desc: '所有歌单列表页', configHref: '/admin/playlists' },
  { icon: '🔎', name: '搜索', path: '/search', desc: '全站搜索', configHref: null },
]

export default function BuiltInPagesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-800">内置页面</h1>
        <p className="text-sm text-gray-400 mt-1">代码内置的功能页面，结构由开发者定义</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          这些是代码内置页面，结构由开发者定义，通过配置项调整展示内容。
        </p>
        <p className="text-sm text-amber-700 mt-1">
          如需完全自定义布局，请使用{' '}
          <Link href="/admin/pages" className="underline font-medium hover:text-amber-900">
            自定义页面
          </Link>{' '}
          功能。
        </p>
      </div>

      <div className="space-y-3">
        {BUILT_IN_PAGES.map(page => (
          <div
            key={page.path}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className="text-3xl shrink-0">{page.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800">{page.name}</div>
              <div className="text-sm text-gray-400 mt-0.5">{page.desc}</div>
              <div className="text-xs text-gray-300 font-mono mt-1">{page.path}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href={page.path}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                预览
              </a>
              {page.configHref && (
                <Link
                  href={page.configHref}
                  className="px-3 py-1.5 rounded-lg text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                >
                  管理配置
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
