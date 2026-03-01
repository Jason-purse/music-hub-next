import { NextRequest, NextResponse } from 'next/server'
import { getPages, savePage, deletePage } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pages = await getPages()
    const page = pages.find(p => p.id === params.id)
    if (!page) return NextResponse.json({ error: '页面不存在' }, { status: 404 })
    return NextResponse.json(page)
  } catch (e) {
    return NextResponse.json({ error: '获取页面失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const pages = await getPages()
    const existing = pages.find(p => p.id === params.id)
    if (!existing) return NextResponse.json({ error: '页面不存在' }, { status: 404 })

    const updated = {
      ...existing,
      ...body,
      id: params.id,
      updatedAt: Date.now(),
    }
    await savePage(updated)
    revalidatePath(`/pages/${updated.slug}`)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: '更新页面失败' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deletePage(params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: '删除页面失败' }, { status: 500 })
  }
}
