import { NextRequest, NextResponse } from 'next/server'
import { getAllPlugins, upsertPlugin } from '@/lib/plugins-db'
import { seedBuiltinPlugins } from '@/lib/plugins/seed'
import type { PluginManifest } from '@/types/plugin'

function ensureSeeded() {
  try { seedBuiltinPlugins() } catch (e) {
    console.error('[plugins] seed error:', e)
  }
}

// GET /api/plugins — 返回所有已安装插件（含内置）
export async function GET() {
  ensureSeeded()
  const plugins = getAllPlugins()
  return NextResponse.json({ plugins, total: plugins.length })
}

// POST /api/plugins — 安装插件
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { id: string; name: string; manifest: PluginManifest }
    if (!body.id || !body.name) {
      return NextResponse.json({ error: '缺少必要字段 id/name' }, { status: 400 })
    }
    const manifest: PluginManifest = body.manifest || {
      id: body.id,
      name: body.name,
      version: '1.0.0',
      category: 'feature',
      priority: 10,
    }
    ensureSeeded()
    const plugin = upsertPlugin(manifest)
    return NextResponse.json({ ok: true, plugin }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
