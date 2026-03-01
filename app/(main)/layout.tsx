import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import DisclaimerModal from '@/components/DisclaimerModal';
import { PluginUIHost } from '@/components/PluginUIHost';
import { getAllPlugins } from '@/lib/plugins-db';
import { seedBuiltinPlugins } from '@/lib/plugins/seed';
import Link from 'next/link';

const UI_PLUGIN_IDS = ['back-to-top', 'reading-progress']

export default function MainLayout({ children }: { children: React.ReactNode }) {
  // 确保内置插件已种入
  try { seedBuiltinPlugins() } catch {}

  // 读取已启用的 UI 插件状态
  const allPlugins = getAllPlugins()
  const enabledUIPlugins = allPlugins
    .filter(p => UI_PLUGIN_IDS.includes(p.id) && p.enabled)
    .map(p => ({ id: p.id, userConfig: p.userConfig }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-16 md:pt-20 pb-28 md:pb-32 page-enter">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 pb-20 md:pb-3">
        © 2025 MusicHub · 仅供个人欣赏 ·{' '}
        <Link href="/disclaimer" className="hover:text-gray-600 dark:hover:text-gray-300 underline">免责声明</Link>
        {' · '}
        <Link href="/admin" className="hover:text-gray-600 dark:hover:text-gray-300 underline">管理后台</Link>
      </footer>
      <Player />
      <DisclaimerModal />
      <PluginUIHost enabledPlugins={enabledUIPlugins} />
    </div>
  );
}
