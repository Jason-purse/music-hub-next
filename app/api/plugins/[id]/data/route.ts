import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, getPluginData, setPluginData } from '@/lib/plugins-db'
import { verifyAdminToken } from '@/lib/auth'
import { checkPluginApiAccess } from '@/lib/plugin-api-guard'

const VALID_ID = /^[a-z0-9_-]+$/i

// GET /api/plugins/[id]/data — 返回插件全部数据 { data: { key: value, ... } }
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

  const raw = getPluginData(id)
  // 解析 JSON 值，保持向后兼容
  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    try { data[k] = JSON.parse(v) } catch { data[k] = v }
  }
  return NextResponse.json({ data })
}

// PUT /api/plugins/[id]/data — 批量写入配置数据 { data: { key: value, ... } }
// 也兼容旧格式 { key, value }
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

  const body = await req.json() as { data?: Record<string, unknown>; key?: string; value?: unknown }

  // 新格式：批量写入
  if (body.data && typeof body.data === 'object') {
    for (const [k, v] of Object.entries(body.data)) {
      const serialized = typeof v === 'string' ? v : JSON.stringify(v)
      setPluginData(id, k, serialized)
    }
    return NextResponse.json({ ok: true })
  }

  // 旧格式兼容：单 key-value
  if (body.key && typeof body.key === 'string') {
    const value = typeof body.value === 'string' ? body.value : JSON.stringify(body.value)
    setPluginData(id, body.key, value)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'body must contain { data: {...} } or { key, value }' }, { status: 400 })
}
