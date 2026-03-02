import { notFound } from 'next/navigation'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'
import { PluginWCHost } from '@/components/PluginWCHost'

export default async function PluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params
  const plugin = getPluginById(pluginId)
  if (!plugin || !plugin.enabled) return notFound()

  const raw = getPluginRawManifest(pluginId) ?? {}
  const routes = (raw.routes ?? []) as { path: string; component: string; title?: string }[]
  const routeDecl = routes.find(r => r.path === '/')
  if (!routeDecl) return notFound()

  const scriptUrl = raw.script ? `/api/plugins/${pluginId}/script` : null

  return (
    <div className="min-h-screen">
      <PluginWCHost
        pluginId={pluginId}
        tagName={routeDecl.component}
        scriptUrl={scriptUrl}
        config={plugin.userConfig ?? {}}
      />
    </div>
  )
}
