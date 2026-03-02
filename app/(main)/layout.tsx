import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import DisclaimerModal from '@/components/DisclaimerModal';
import { PluginUIHost } from '@/components/PluginUIHost';
import { PluginSlot } from '@/components/PluginSlot';
import { getAllPlugins } from '@/lib/plugins-db';
import { seedBuiltinPlugins } from '@/lib/plugins/seed';
import Link from 'next/link';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  try { seedBuiltinPlugins() } catch {}

  const UI_PLUGIN_IDS = ['back-to-top', 'reading-progress']
  const allPlugins = getAllPlugins()
  const enabledUIPlugins = allPlugins
    .filter(p => UI_PLUGIN_IDS.includes(p.id) && p.enabled)
    .map(p => ({ id: p.id, userConfig: p.userConfig }))

  // 读取 dock 位置 cookie（SSR 防闪）
  const cookieStore = await cookies();
  const dockPos = cookieStore.get('nav-dock-position')?.value ?? 'bottom';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col" data-dock-position={dockPos}>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-16 md:pt-20 pb-28 md:pb-32 page-enter">
        {children}
      </main>
      <PluginSlot name="main-footer" />
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-20 md:pb-3">
        © 2025 MusicHub · 仅供个人欣赏 ·{' '}
        <Link href="/disclaimer" className="hover:text-gray-600 dark:hover:text-gray-300 underline">免责声明</Link>
        {' · '}
        <Link href="/admin" className="hover:text-gray-600 dark:hover:text-gray-300 underline">管理后台</Link>
      </footer>
      <Player />
      <DisclaimerModal />
      <PluginUIHost enabledPlugins={enabledUIPlugins} />
      {/* site-overlay 槽：nav-dock 等全局叠加层插件通过此槽注入 */}
      <PluginSlot name="site-overlay" />
    </div>
  );
}
