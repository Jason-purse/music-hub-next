import { NextRequest, NextResponse } from 'next/server'
import { getPages, savePage } from '@/lib/db'
import { PageDescriptor } from '@/lib/blocks/types'

export async function GET() {
  try {
    const pages = await getPages()
    return NextResponse.json(pages)
  } catch (e) {
    return NextResponse.json({ error: '获取页面列表失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = Date.now()
    const page: PageDescriptor = {
      id: body.id || `page_${now}`,
      slug: body.slug || `page-${now}`,
      title: body.title || '新页面',
      layout: body.layout || 'single-col',
      slots: body.slots || { main: [] },
      published: body.published ?? false,
      createdAt: now,
      updatedAt: now,
    }
    await savePage(page)
    return NextResponse.json(page, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: '创建页面失败' }, { status: 500 })
  }
}
