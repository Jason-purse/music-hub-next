import { notFound } from 'next/navigation'
import { getPluginById, getPluginRawManifest } from '@/lib/plugins-db'

export default async function AdminPluginPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = await params
  const plugin = getPluginById(pluginId)
  if (!plugin || !plugin.enabled) return notFound()

  const raw = getPluginRawManifest(pluginId) ?? {}
  const adminMenu = (raw.adminMenu ?? []) as { path: string; component: string }[]
  const menuDecl = adminMenu.find(m => m.path === '/')
  if (!menuDecl) return notFound()

  const scriptUrl = raw.script ? `/api/plugins/${pluginId}/script` : null
  const configAttr = JSON.stringify(plugin.userConfig ?? {}).replace(/"/g, '&quot;')
  const html = [
    scriptUrl ? `<script src="${scriptUrl}" type="module" defer></script>` : '',
    `<${menuDecl.component} plugin-config="${configAttr}"></${menuDecl.component}>`,
  ].join('\n')

  return <div className="p-6 min-h-full" dangerouslySetInnerHTML={{ __html: html }} />
}
