import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, deletePluginData } from '@/lib/plugins-db'
import { verifyAdminToken } from '@/lib/auth'

const VALID_ID = /^[a-z0-9_-]+$/i
const VALID_KEY = /^[a-zA-Z0-9_.-]+$/

// DELETE /api/plugins/[id]/data/[key] — 删除插件数据的某个 key（需 admin token）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  const { id, key } = await params

  const token = req.headers.get('x-admin-token') || ''
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid plugin id' }, { status: 400 })
  }

  if (!VALID_KEY.test(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const plugin = getPluginById(id)
  if (!plugin) {
    return NextResponse.json({ error: '插件不存在' }, { status: 404 })
  }

  const deleted = deletePluginData(id, key)
  return NextResponse.json({ ok: true, deleted })
}
