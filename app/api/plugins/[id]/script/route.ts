import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'
import fs from 'fs'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const plugin = getPluginById(id)
  if (!plugin || !plugin.enabled) return new NextResponse('Not Found', { status: 404 })

  const rawManifest = getPluginRawManifest(id)
  const scriptRel = rawManifest?.script as string | undefined
  if (!scriptRel) return new NextResponse('No script declared', { status: 404 })

  const scriptPath = path.join(process.cwd(), 'content/installed-plugins', id, scriptRel)
  if (!fs.existsSync(scriptPath)) return new NextResponse('Script file not found', { status: 404 })

  return new NextResponse(fs.readFileSync(scriptPath, 'utf-8'), {
    headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'public, max-age=3600' },
  })
}
