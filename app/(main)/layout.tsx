import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import DisclaimerModal from '@/components/DisclaimerModal';
import Link from 'next/link';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-16 md:pt-20 pb-28 md:pb-32 page-enter">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-100 bg-white pb-20 md:pb-3">
        © 2025 MusicHub · 仅供个人欣赏 ·{' '}
        <Link href="/disclaimer" className="hover:text-gray-600 underline">免责声明</Link>
        {' · '}
        <Link href="/admin" className="hover:text-gray-600 underline">管理后台</Link>
      </footer>
      <Player />
      <DisclaimerModal />
    </div>
  );
}
