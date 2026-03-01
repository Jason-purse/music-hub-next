'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePlayerStore } from '@/stores/player';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/',          label: '首页' },
  { href: '/discover',  label: '发现' },
  { href: '/rankings',  label: '排行榜' },
  { href: '/playlists', label: '歌单' },
];

export default function Navbar() {
  const pathname     = usePathname();
  const currentSong  = usePlayerStore(s => s.currentSong);
  const isPlaying    = usePlayerStore(s => s.isPlaying);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ]   = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 transition-all duration-300
      ${scrolled
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-b border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none'
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md md:bg-transparent md:dark:bg-transparent'
      }`}>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <span className="text-indigo-500 text-xl">♫</span>
        <span className="font-bold text-gray-800 dark:text-gray-100 tracking-wide text-sm hidden sm:block">MusicHub</span>
      </Link>

      {/* 桌面导航 */}
      <div className="hidden md:flex items-center gap-1 ml-4">
        {NAV_LINKS.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all
                ${active
                  ? 'text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-800'
                }`}>
              {label}
            </Link>
          );
        })}
      </div>

      {/* 当前播放提示（桌面） */}
      {scrolled && currentSong && (
        <div className="hidden lg:flex items-center gap-2 flex-1 justify-center min-w-0">
          <div className="flex items-end gap-[2px] h-3">
            {isPlaying ? (
              <>
                <span className="w-[3px] bg-indigo-400 rounded-full playing-bar playing-bar-1 h-3" />
                <span className="w-[3px] bg-indigo-400 rounded-full playing-bar playing-bar-2 h-3" />
                <span className="w-[3px] bg-indigo-400 rounded-full playing-bar playing-bar-3 h-3" />
              </>
            ) : (
              <span className="text-indigo-400 text-xs">♪</span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
            {currentSong.title} · {currentSong.artist}
          </span>
        </div>
      )}

      {/* 搜索框（桌面） */}
      <form className="hidden md:block ml-auto" onSubmit={e => { e.preventDefault(); if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q)}`; }}>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="搜索歌曲、歌手..."
          className="w-36 lg:w-48 h-8 px-3 text-xs bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 rounded-full border border-transparent focus:border-indigo-200 dark:focus:border-indigo-700 outline-none transition-all focus:w-56 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </form>

      {/* 主题切换按钮 */}
      <div className="hidden md:flex ml-2">
        <ThemeToggle />
      </div>

      {/* 移动端汉堡按钮 */}
      <button
        className="md:hidden ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        onClick={() => setMenuOpen(v => !v)}
        aria-label="菜单">
        <div className="relative w-5 h-4 flex flex-col justify-between">
          <span className={`w-full h-0.5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all origin-center ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`w-full h-0.5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-full h-0.5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all origin-center ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </div>
      </button>

      {/* 移动端展开菜单 */}
      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg px-4 py-3 space-y-1">
          <form className="mb-3" onSubmit={e => { e.preventDefault(); if (q.trim()) { window.location.href = `/search?q=${encodeURIComponent(q)}`; setMenuOpen(false); } }}>
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="搜索歌曲、歌手..."
              className="w-full h-10 px-4 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border border-transparent focus:border-indigo-200 dark:focus:border-indigo-700 outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </form>
          {NAV_LINKS.map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition
                  ${active
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                {label}
              </Link>
            );
          })}
          <div className="flex items-center px-3 py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">主题</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </nav>
  );
}
