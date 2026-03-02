import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'
import fs from 'fs'
import path from 'path'

// 只允许安全的插件 ID（字母数字连字符下划线）
const VALID_ID = /^[a-z0-9_-]+$/i

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. 校验 ID 格式，防路径穿越
  if (!VALID_ID.test(id)) {
    return new NextResponse('Invalid plugin id', { status: 400 })
  }

  // 2. 查 DB，插件必须存在且已启用
  const plugin = getPluginById(id)
  if (!plugin || !plugin.enabled) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // 3. 读 raw manifest 拿 script 路径
  const rawManifest = getPluginRawManifest(id)
  const scriptRel = rawManifest?.script as string | undefined
  if (!scriptRel) {
    return new NextResponse('No script declared', { status: 404 })
  }

  // 4. 防路径穿越：规范化后必须仍在插件目录内
  const pluginDir = path.resolve(process.cwd(), 'content/installed-plugins', id)
  const scriptPath = path.resolve(pluginDir, scriptRel)
  if (!scriptPath.startsWith(pluginDir + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // 5. 文件必须存在
  if (!fs.existsSync(scriptPath)) {
    return new NextResponse('Script file not found', { status: 404 })
  }

  // 6. 只允许 .js 文件
  if (!scriptPath.endsWith('.js')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const content = fs.readFileSync(scriptPath, 'utf-8')
  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
