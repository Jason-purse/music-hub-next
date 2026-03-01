'use client'

import { useEffect, useState } from 'react'
import { blockMetaRegistry } from '@/lib/blocks/meta'
// ⚠️ 不能 import '@/lib/blocks/index'（含 Server Components），meta.ts 已含所有 Preview 组件

// ---- layout helpers ----
const LAYOUT_STYLES: Record<string, React.CSSProperties> = {
  'single-col':        { display: 'block' },
  'two-col-sidebar':   { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' },
  'hero-then-content': { display: 'block' },
  'two-col-equal':     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  'three-col':         { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' },
  'hero-full':         { display: 'block' },
  'magazine':          { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' },
}

const LAYOUT_SLOTS: Record<string, string[]> = {
  'single-col':        ['main'],
  'two-col-sidebar':   ['main', 'sidebar'],
  'hero-then-content': ['hero', 'content'],
  'two-col-equal':     ['left', 'right'],
  'three-col':         ['col1', 'col2', 'col3'],
  'hero-full':         ['hero'],
  'magazine':          ['hero', 'top-right', 'bottom-right'],
}

function BlocksRenderer({ blocks }: { blocks: any[] }) {
  return (
    <>
      {blocks.map((block: any) => {
        const meta = blockMetaRegistry.get(block.type)
        if (!meta?.Preview) return null
        return (
          <div key={block.id}>
            <meta.Preview props={block.props} />
          </div>
        )
      })}
    </>
  )
}

function PageLayout({ page }: { page: any }) {
  const layoutStyle = LAYOUT_STYLES[page.layout] || { display: 'block' }
  const slotOrder = LAYOUT_SLOTS[page.layout] || Object.keys(page.slots || {})

  if (page.layout === 'hero-then-content') {
    return (
      <div>
        <BlocksRenderer blocks={page.slots?.hero || []} />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <BlocksRenderer blocks={page.slots?.content || []} />
        </div>
      </div>
    )
  }

  if (page.layout === 'single-col' || page.layout === 'hero-full') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        {slotOrder.map(slot => (
          <BlocksRenderer key={slot} blocks={page.slots?.[slot] || []} />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div style={layoutStyle}>
        {slotOrder.map(slot => (
          <div key={slot}>
            <BlocksRenderer blocks={page.slots?.[slot] || []} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPreviewPage({ params }: { params: { id: string } }) {
  const [page, setPage] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // 1. 首次从 API 加载页面数据
    fetch(`/api/pages/${params.id}`)
      .then(r => r.json())
      .then(data => setPage(data))
      .catch(console.error)

    // 2. 监听编辑器通过 BroadcastChannel 推送的实时更新
    const bc = new BroadcastChannel('musichub-preview')
    bc.onmessage = (evt) => {
      if (evt.data?.type === 'UPDATE' && evt.data.page) {
        setPage(evt.data.page)
        setLastUpdated(new Date())
      }
    }
    return () => bc.close()
  }, [params.id])

  return (
    <div className="min-h-screen bg-white">
      {/* 预览 Banner */}
      <div className="sticky top-0 z-50 bg-amber-400 text-amber-900 text-center text-xs py-1.5 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-700 rounded-full animate-pulse" />
          实时预览模式
        </span>
        {lastUpdated && (
          <span className="opacity-70">最近更新: {lastUpdated.toLocaleTimeString()}</span>
        )}
      </div>

      {/* 模拟导航栏 */}
      <nav className="bg-white border-b border-gray-100 shadow-sm px-6 h-14 flex items-center gap-3">
        <span className="text-xl">🎵</span>
        <span className="font-bold text-gray-800">MusicHub</span>
        <div className="ml-auto hidden md:flex items-center gap-5 text-sm text-gray-500">
          <span>首页</span><span>排行榜</span><span>歌单</span><span>搜索</span>
        </div>
      </nav>

      {/* 页面内容 */}
      <main className="pb-20">
        {page ? (
          <PageLayout page={page} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            加载中…
          </div>
        )}
      </main>

      {/* 模拟播放器 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-lg shrink-0">🎵</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 truncate">大约在冬季</div>
          <div className="text-xs text-gray-400">齐秦</div>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-lg">
          <span>⏮</span><span className="text-indigo-600">▶</span><span>⏭</span>
        </div>
      </div>
    </div>
  )
}
