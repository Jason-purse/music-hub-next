import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, getPluginData, setPluginData } from '@/lib/plugins-db'
import { verifyAdminToken } from '@/lib/auth'
import { checkPluginApiAccess } from '@/lib/plugin-api-guard'

const VALID_ID = /^[a-z0-9_-]+$/i

// GET /api/plugins/[id]/data — 返回插件全部数据 { key: value, ... }
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 访问控制检查
  const denied = await checkPluginApiAccess(req)
  if (denied) return denied

  const { id } = await params

  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid plugin id' }, { status: 400 })
  }

  const plugin = getPluginById(id)
  if (!plugin) {
    return NextResponse.json({ error: '插件不存在' }, { status: 404 })
  }

  const data = getPluginData(id)
  return NextResponse.json(data)
}

// PUT /api/plugins/[id]/data — 写入 { key, value }（需 admin token）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const token = req.headers.get('x-admin-token') || ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid plugin id' }, { status: 400 })
  }

  const plugin = getPluginById(id)
  if (!plugin) {
    return NextResponse.json({ error: '插件不存在' }, { status: 404 })
  }

  const body = await req.json() as { key?: string; value?: unknown }
  if (!body.key || typeof body.key !== 'string') {
    return NextResponse.json({ error: 'key is required and must be a string' }, { status: 400 })
  }

  const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value)
  setPluginData(id, body.key, value)

  return NextResponse.json({ ok: true })
}
