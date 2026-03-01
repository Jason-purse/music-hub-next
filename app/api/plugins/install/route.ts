import { NextResponse } from 'next/server'
import { pluginRegistry } from '@/lib/plugins/registry'
import { MARKET_PLUGINS } from '@/lib/plugins/builtin'

export async function POST(req: Request) {
  try {
    const { pluginId, action } = await req.json()
    if (!pluginId) return NextResponse.json({ error: '缺少 pluginId' }, { status: 400 })

    if (action === 'uninstall') {
      await pluginRegistry.uninstallPlugin(pluginId)
      return NextResponse.json({ ok: true, action: 'uninstalled' })
    }

    const plugin = MARKET_PLUGINS.find(p => p.id === pluginId)
    if (!plugin) return NextResponse.json({ error: '插件不存在' }, { status: 404 })

    await pluginRegistry.installPlugin(pluginId)
    return NextResponse.json({ ok: true, plugin })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
