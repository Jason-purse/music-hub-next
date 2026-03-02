import { NextRequest, NextResponse } from 'next/server'
import { deleteRegistry, updateRegistry } from '@/lib/plugin-registries'

// DELETE /api/plugins/registries/[id] — 删除注册表（官方源不可删）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (id === 'official') {
    return NextResponse.json({ error: '官方源不可删除，只能禁用' }, { status: 403 })
  }
  const ok = deleteRegistry(id)
  if (!ok) {
    return NextResponse.json({ error: '注册表不存在' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

// PATCH /api/plugins/registries/[id] — 更新注册表（主要用于切换 enabled）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json() as { enabled?: boolean; name?: string; url?: string }
  const updated = updateRegistry(id, body)
  if (!updated) {
    return NextResponse.json({ error: '注册表不存在' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, registry: updated })
}
