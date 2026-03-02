import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/db'

/**
 * 检查插件公开 API 访问权限
 * 返回 null 表示允许，返回 NextResponse 表示拒绝（直接 return）
 */
export async function checkPluginApiAccess(req: NextRequest): Promise<NextResponse | null> {
  const settings = await getSettings()
  const access = settings.pluginApiAccess ?? 'same-origin'

  if (access === 'disabled') {
    return NextResponse.json({ error: 'Plugin API disabled' }, { status: 403 })
  }

  if (access === 'same-origin') {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    // 同源判断：无 origin（服务端/直接访问）或 origin 与 host 匹配
    if (origin && !origin.includes(host ?? '')) {
      return NextResponse.json({ error: 'Cross-origin plugin API access denied' }, { status: 403 })
    }
  }

  return null // public 或通过同源检查
}
