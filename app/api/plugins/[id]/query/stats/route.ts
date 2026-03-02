import { NextRequest, NextResponse } from 'next/server'
import { getPluginById } from '@/lib/plugins-db'
import { getDB } from '@/lib/db'
import { checkPluginApiAccess } from '@/lib/plugin-api-guard'

const VALID_ID = /^[a-z0-9_-]+$/i

// GET /api/plugins/[id]/query/stats — 返回站点统计
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
  if (!plugin || !plugin.enabled) {
    return NextResponse.json({ error: '插件不存在或未启用' }, { status: 404 })
  }

  const db = await getDB()
  const totalPlays = db.songs.reduce((sum, s) => sum + (s.play_count || 0), 0)

  return NextResponse.json({
    songs: db.songs.length,
    playlists: db.playlists.length,
    plays: totalPlays,
  })
}
