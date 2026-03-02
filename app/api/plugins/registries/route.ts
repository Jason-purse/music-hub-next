import { NextRequest, NextResponse } from 'next/server'
import { getRegistries, addRegistry } from '@/lib/plugin-registries'

// GET /api/plugins/registries — 获取所有注册表
export async function GET() {
  const registries = getRegistries()
  return NextResponse.json({ registries })
}

// POST /api/plugins/registries — 添加注册表
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; url?: string }
    if (!body.name?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: '名称和 URL 不能为空' }, { status: 400 })
    }

    // 简单校验 URL
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json({ error: 'URL 格式不正确' }, { status: 400 })
    }

    const entry = addRegistry(body.name.trim(), body.url.trim())
    return NextResponse.json({ ok: true, registry: entry }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
