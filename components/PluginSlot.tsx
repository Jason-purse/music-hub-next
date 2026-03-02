/**
 * PluginSlot — 服务端命名注入点 (Server Component)
 * 读取 DB，找出对应 slot 的启用插件，委托 PluginWCHost 安全渲染
 *
 * 用法：在任意 Server Component 中
 *   <PluginSlot name="player-footer" />
 *   <PluginSlot name="nav-actions" className="flex gap-2" />
 */
import { getSlotPlugins } from '@/lib/plugin-system/registry'
import { PluginWCHost } from './PluginWCHost'

interface Props {
  name: string
  className?: string
}

export async function PluginSlot({ name, className }: Props) {
  const items = await getSlotPlugins(name)
  if (items.length === 0) return null

  return (
    <div data-plugin-slot={name} className={className}>
      {items.map(({ plugin, decl }) => (
        <PluginWCHost
          key={`${plugin.id}-${decl.component}`}
          pluginId={plugin.id}
          tagName={decl.component}
          scriptUrl={plugin.scriptUrl}
          config={plugin.userConfig}
          attrs={decl.props}
        />
      ))}
    </div>
  )
}
