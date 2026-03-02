import { NextResponse } from 'next/server'
import { getPluginBlocks } from '@/lib/plugin-system/registry'

// GET /api/plugins/blocks — 返回所有已启用插件的 blocks 列表
export async function GET() {
  try {
    const blocks = getPluginBlocks()
    return NextResponse.json({ blocks })
  } catch (e) {
    return NextResponse.json({ blocks: [], error: String(e) }, { status: 500 })
  }
}
