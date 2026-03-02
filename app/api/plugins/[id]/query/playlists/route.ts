import { NextRequest, NextResponse } from 'next/server'
import { getPluginById } from '@/lib/plugins-db'
import { getPlaylists } from '@/lib/db'

const VALID_ID = /^[a-z0-9_-]+$/i

// GET /api/plugins/[id]/query/playlists?limit=10
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: 'Invalid plugin id' }, { status: 400 })
  }

  const plugin = getPluginById(id)
  if (!plugin || !plugin.enabled) {
    return NextResponse.json({ error: '插件不存在或未启用' }, { status: 404 })
  }

  const url = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100)

  const playlists = await getPlaylists()
  return NextResponse.json({
    playlists: playlists.slice(0, limit),
    total: playlists.length,
  })
}
