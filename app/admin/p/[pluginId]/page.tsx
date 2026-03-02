import { notFound } from 'next/navigation'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'
import { PluginWCHost } from '@/components/PluginWCHost'

export default async function AdminPluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params
  const plugin = getPluginById(pluginId)
  if (!plugin || !plugin.enabled) return notFound()

  const raw = getPluginRawManifest(pluginId) ?? {}
  const adminMenu = (raw.adminMenu ?? []) as { path: string; component: string }[]
  const menuDecl = adminMenu.find(m => m.path === '/')
  if (!menuDecl) return notFound()

  const scriptUrl = raw.script ? `/api/plugins/${pluginId}/script` : null

  return (
    <div className="p-6 min-h-full">
      <PluginWCHost
        pluginId={pluginId}
        tagName={menuDecl.component}
        scriptUrl={scriptUrl}
        config={plugin.userConfig ?? {}}
      />
    </div>
  )
}
