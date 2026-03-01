import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, updatePlugin, deletePlugin } from '@/lib/plugins-db'
import { seedBuiltinPlugins } from '@/lib/plugins/seed'

function ensureSeeded() {
  try { seedBuiltinPlugins() } catch {}
}

// GET /api/plugins/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureSeeded()
  const plugin = getPluginById(params.id)
  if (!plugin) return NextResponse.json({ error: '插件不存在' }, { status: 404 })
  return NextResponse.json({ plugin })
}

// PATCH /api/plugins/[id] — 更新 enabled/config
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureSeeded()
  const existing = getPluginById(params.id)
  if (!existing) return NextResponse.json({ error: '插件不存在' }, { status: 404 })

  const body = await req.json() as { enabled?: boolean; config?: Record<string, unknown> }
  const updated = updatePlugin(params.id, body)
  return NextResponse.json({ ok: true, plugin: updated })
}

// DELETE /api/plugins/[id] — 卸载（内置不可删）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  ensureSeeded()
  const existing = getPluginById(params.id)
  if (!existing) return NextResponse.json({ error: '插件不存在' }, { status: 404 })
  if (existing.builtin) return NextResponse.json({ error: '内置插件不可卸载' }, { status: 403 })

  const ok = deletePlugin(params.id)
  return NextResponse.json({ ok })
}
