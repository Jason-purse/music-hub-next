import { NextRequest, NextResponse } from 'next/server'
import { getPluginById } from '@/lib/plugins-db'
import { getSongs } from '@/lib/db'
import { checkPluginApiAccess } from '@/lib/plugin-api-guard'

const VALID_ID = /^[a-z0-9_-]+$/i

// GET /api/plugins/[id]/query/songs?limit=10&sort=plays&offset=0&decade=90s&tag=rock
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

  // 安全：只允许 enabled 的插件访问
  const plugin = getPluginById(id)
  if (!plugin || !plugin.enabled) {
    return NextResponse.json({ error: '插件不存在或未启用' }, { status: 404 })
  }

  const url = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20'), 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)
  const sort = url.searchParams.get('sort') || undefined
  const decade = url.searchParams.get('decade') || undefined
  const tag = url.searchParams.get('tag') || undefined

  // 映射 sort 值：插件用 'plays'，内部用 'play_count'
  const sortMap: Record<string, string> = { plays: 'play_count', likes: 'like_count' }
  const sortField = sort ? (sortMap[sort] || sort) : undefined

  const result = await getSongs({ limit, offset, sort: sortField, decade, tag })
  return NextResponse.json(result)
}
