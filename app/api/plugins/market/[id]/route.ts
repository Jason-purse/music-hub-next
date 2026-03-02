import { NextRequest, NextResponse } from 'next/server'
import { getPluginById, deletePlugin } from '@/lib/plugins-db'
import { seedBuiltinPlugins } from '@/lib/plugins/seed'
import { pluginStorage } from '@/lib/plugin-storage'

// DELETE /api/plugins/market/[id] — 卸载社区插件
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    seedBuiltinPlugins()
  } catch {}

  const { id } = await params

  try {
    const existing = getPluginById(id)
    if (!existing) {
      return NextResponse.json({ error: '插件不存在' }, { status: 404 })
    }

    // 只允许卸载 community 插件
    if (existing.tier !== 'community') {
      return NextResponse.json(
        { error: '只能卸载社区插件，内置/标准插件不可卸载' },
        { status: 403 }
      )
    }

    // 通过 pluginStorage 删除文件（自动切换 FS / GitHub）
    await pluginStorage.delete(id, `Uninstall plugin: ${id}`)

    // 从 DB 删除
    deletePlugin(id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[market/uninstall] error:', e)
    return NextResponse.json({ error: '卸载失败: ' + String(e) }, { status: 500 })
  }
}
