import { NextResponse } from 'next/server'
import { getPages, savePage } from '@/lib/db/index'

// 保存草稿（不触发 revalidatePath，不影响已发布页面）
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { layout, slots } = body

    const pages = await getPages()
    const page = pages.find(p => p.id === params.id)
    if (!page) return NextResponse.json({ error: 'page not found' }, { status: 404 })

    const updated = {
      ...page,
      draft: { layout, slots },
      updatedAt: new Date().toISOString() as any,
    }
    await savePage(updated)

    // 注意：不调用 revalidatePath，草稿不影响正式发布页面的 CDN 缓存
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// 清除草稿
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pages = await getPages()
    const page = pages.find(p => p.id === params.id)
    if (!page) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const updated = { ...page, draft: undefined }
    await savePage(updated)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
