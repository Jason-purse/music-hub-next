'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/discover', label: '发现', icon: '🎵' },
  { href: '/rankings', label: '排行榜', icon: '📊' },
  { href: '/playlists', label: '歌单', icon: '📋' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Logo */}
        <Link href="/" className="text-indigo-600 font-bold text-lg shrink-0">🎶 MusicHub</Link>

        {/* 桌面导航 */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${pathname === item.href ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 搜索框 */}
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
          className="flex-1 max-w-xs ml-auto">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索歌曲、歌手..."
            className="w-full h-8 px-3 text-sm bg-gray-100 rounded-full border-0 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300 transition" />
        </form>
      </div>

      {/* 移动端底部导航 */}
      <nav className="md:hidden flex border-t border-gray-100">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition ${pathname === item.href ? 'text-indigo-600' : 'text-gray-500'}`}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <Link href="/search" className={`flex-1 flex flex-col items-center py-2 text-xs ${pathname === '/search' ? 'text-indigo-600' : 'text-gray-500'}`}>
          <span className="text-lg">🔍</span><span>搜索</span>
        </Link>
      </nav>
    </header>
  );
}
