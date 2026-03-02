/**
 * Admin Layout — Server Component wrapper
 * 读取插件 adminMenu 注入侧边栏，再渲染 Client Shell
 */
import { getPluginAdminMenuItems } from '@/lib/plugin-system/registry'
import { AdminLayoutClient } from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server 端读取插件贡献的菜单项
  const pluginMenuRaw = await getPluginAdminMenuItems()
  const pluginMenuItems = pluginMenuRaw.map(({ plugin, item }) => ({
    icon: item.icon,
    label: item.label,
    href: `/admin/p/${plugin.id}`,
  }))

  return (
    <AdminLayoutClient pluginMenuItems={pluginMenuItems}>
      {children}
    </AdminLayoutClient>
  )
}
