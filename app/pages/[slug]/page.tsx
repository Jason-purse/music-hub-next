import { getDB } from '@/lib/db/index'
import '@/lib/blocks/index'  // register all plugins
import { blockRegistry, SlotRenderer } from '@/lib/blocks'
import { LAYOUTS } from '@/lib/blocks/layouts'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Player from '@/components/Player'
import Link from 'next/link'

export const revalidate = 0

export default async function MusicPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { preview?: string }
}) {
  const db = await getDB() as any
  const isPreview = searchParams.preview === '1'

  // 预览模式允许查看未发布页面；正式模式只看已发布页面
  const page = (db.pages || []).find((p: any) =>
    p.slug === params.slug && (isPreview || p.published)
  )
  if (!page) return notFound()

  // 预览模式：读 draft（如果有），否则 fallback 到已发布内容
  const renderLayout = isPreview && page.draft ? page.draft.layout : page.layout
  const renderSlots = isPreview && page.draft ? page.draft.slots : page.slots

  const Layout = LAYOUTS[renderLayout as keyof typeof LAYOUTS] || LAYOUTS['single-col']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 预览模式角标：右上角小徽章，不遮挡内容 */}
      {isPreview && (
        <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-medium px-2.5 py-1 rounded-full shadow-md select-none pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 opacity-80" />
          预览{page.draft ? '（草稿）' : ''}
        </div>
      )}
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 pt-20 pb-32">
          <h1 className="sr-only">{page.title}</h1>
          <Layout slots={renderSlots} />
        </main>
        <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-100 bg-white pb-20 md:pb-3">
          © 2025 MusicHub · 仅供个人欣赏 ·{' '}
          <Link href="/disclaimer" className="hover:text-gray-600 underline">免责声明</Link>
          {' · '}
          <Link href="/admin" className="hover:text-gray-600 underline">管理后台</Link>
        </footer>
        <Player />
      </div>
    </div>
  )
}
