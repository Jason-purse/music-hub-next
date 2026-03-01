import { NextResponse } from 'next/server'
import { pluginRegistry } from '@/lib/plugins/registry'

export async function GET() {
  const [installed, market] = await Promise.all([
    pluginRegistry.getInstalled(),
    pluginRegistry.getMarket(),
  ])
  return NextResponse.json({ installed, market })
}
