/**
 * PluginSlot — 服务端插件注入点 (Server Component)
 *
 * 用法：
 *   <PluginSlot name="player-footer" />
 *   <PluginSlot name="nav-actions" className="flex items-center gap-2" />
 */
import { getSlotPlugins } from '@/lib/plugin-system/registry'

interface Props {
  name: string
  className?: string
}

export async function PluginSlot({ name, className }: Props) {
  const items = await getSlotPlugins(name)
  if (items.length === 0) return null

  return (
    <div data-plugin-slot={name} className={className}>
      {items.map(({ plugin, decl }) => {
        const tag = decl.component
        const extraAttrs = Object.entries(decl.props ?? {})
          .map(([k, v]) => `${k}="${String(v)}"`)
          .join(' ')
        const configAttr = JSON.stringify(plugin.userConfig).replace(/"/g, '&quot;')

        const html = [
          plugin.scriptUrl
            ? `<script src="${plugin.scriptUrl}" type="module" data-plugin-script="${plugin.id}" defer></script>`
            : '',
          `<${tag} plugin-config="${configAttr}" ${extraAttrs}></${tag}>`,
        ].join('\n')

        return (
          <div
            key={`${plugin.id}-${tag}`}
            data-plugin-id={plugin.id}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}
