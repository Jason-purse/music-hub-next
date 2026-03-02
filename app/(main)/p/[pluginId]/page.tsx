import { notFound } from 'next/navigation'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'

export default async function PluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params
  const plugin = getPluginById(pluginId)
  if (!plugin || !plugin.enabled) return notFound()

  const raw = getPluginRawManifest(pluginId) ?? {}
  const routes = (raw.routes ?? []) as { path: string; component: string }[]
  const routeDecl = routes.find(r => r.path === '/')
  if (!routeDecl) return notFound()

  const scriptUrl = raw.script ? `/api/plugins/${pluginId}/script` : null
  const configAttr = JSON.stringify(plugin.userConfig ?? {}).replace(/"/g, '&quot;')
  const html = [
    scriptUrl ? `<script src="${scriptUrl}" type="module" defer></script>` : '',
    `<${routeDecl.component} plugin-config="${configAttr}"></${routeDecl.component}>`,
  ].join('\n')

  return <div className="min-h-screen" dangerouslySetInnerHTML={{ __html: html }} />
}
