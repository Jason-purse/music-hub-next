'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SongList from '@/components/SongList';
import { usePlayerStore } from '@/stores/player';

interface Song { id: string; title: string; artist: string; [k: string]: any; }
interface Chart { label: string; icon: string; limit: number; songs: Song[]; color: string; }

interface Props {
  hot: Chart;
  liked: Chart;
  newest: Chart;
  byDecade: Record<string, Song[]>;
  decadeLimit: number;
  decadeEnabled: boolean;
}

const SECTIONS = [
  { id: 'hot',     label: '热播榜',   icon: '🔥', color: 'rgb(239,68,68)' },
  { id: 'liked',   label: '最受欢迎', icon: '❤️', color: 'rgb(236,72,153)' },
  { id: 'decades', label: '年代精选', icon: '🎵', color: 'rgb(99,102,241)' },
  { id: 'newest',  label: '新上架',   icon: '✨', color: 'rgb(34,197,94)' },
];

// 检测滚动方向
function useScrollDirection() {
  const [dir, setDir] = useState<'up' | 'down'>('up');
  const last = useRef(0);
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (Math.abs(y - last.current) < 6) return;
      setDir(y > last.current ? 'down' : 'up');
      last.current = y;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return dir;
}

// Sticky header with sentinel 检测
function ChartSection({
  id, label, icon, color, songs, showRank, totalInSection, nowPlayingRank,
}: {
  id: string; label: string; icon: string; color: string;
  songs: Song[]; showRank: boolean; totalInSection: number; nowPlayingRank: number | null;
}) {
  const [isStuck, setIsStuck] = useState(false);
  const [visibleEnd, setVisibleEnd] = useState(5);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sectionRef  = useRef<HTMLDivElement>(null);
  const endRef      = useRef<HTMLDivElement>(null);
  const [completed, setCompleted] = useState(false);

  // sentinel 检测是否 sticky
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => setIsStuck(!e.isIntersecting), {
      threshold: 0, rootMargin: '-1px 0px 0px 0px',
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 滚动时计算可见范围
  useEffect(() => {
    const handler = () => {
      const sec = sectionRef.current; if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const visible = Math.min(totalInSection, Math.max(1,
        Math.round((140 - rect.top) / (rect.height / totalInSection))
      ));
      setVisibleEnd(Math.max(1, Math.min(totalInSection, visible)));
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [totalInSection]);

  // 完成检测
  useEffect(() => {
    const el = endRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !completed) setCompleted(true);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [completed]);

  const remaining = totalInSection - visibleEnd;
  const pct = (visibleEnd / totalInSection) * 100;
  const isAbove = nowPlayingRank !== null && nowPlayingRank < visibleEnd - 3;
  const isBelow = nowPlayingRank !== null && nowPlayingRank > visibleEnd;
  const showBadge = nowPlayingRank !== null && (isAbove || isBelow);

  return (
    <section id={`section-${id}`} ref={sectionRef} className="scroll-mt-16">
      {/* Sentinel — 触发 sticky 检测 */}
      <div ref={sentinelRef} style={{ height: 1, marginBottom: -1 }} />

      {/* Sticky Header */}
      <div className={`sticky top-16 z-20 transition-all duration-200 ${isStuck ? 'shadow-md' : ''}`}
        style={{ background: isStuck ? 'rgba(255,255,255,0.88)' : 'transparent', backdropFilter: isStuck ? 'blur(16px)' : 'none' }}>

        <div className={`flex items-center gap-3 px-1 transition-all duration-200 ${isStuck ? 'py-2' : 'py-3'}`}>
          {/* 榜单标题 */}
          <span className="text-lg">{icon}</span>
          <h2 className={`font-bold transition-all duration-200 ${isStuck ? 'text-base' : 'text-xl'}`}
            style={{ color }}>
            {label}
          </h2>

          {/* 当前范围 */}
          {isStuck && (
            <span className="text-xs text-gray-400 tabular-nums">
              正在看 #{Math.max(1, visibleEnd - 4)}–#{visibleEnd}
            </span>
          )}

          <div className="flex-1" />

          {/* 还有X首 */}
          {isStuck && remaining > 0 && (
            <span className="text-xs text-gray-400">还有 {remaining} 首</span>
          )}
          {isStuck && remaining === 0 && (
            <span className="text-xs" style={{ color }}>✓ 看完了</span>
          )}

          {/* NOW PLAYING badge */}
          {showBadge && (
            <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}>
              <div className="flex items-end gap-[2px] h-3">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-[2px] rounded-full playing-bar h-3"
                    style={{ backgroundColor: color, animationDelay: `${d}ms` }} />
                ))}
              </div>
              #{nowPlayingRank} {isAbove ? '↑' : '↓'}
            </div>
          )}
        </div>

        {/* section进度条（极细线，贴在 header 底部） */}
        {isStuck && (
          <div className="h-[2px] bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: color }} />
          </div>
        )}
      </div>

      {/* 歌曲列表 */}
      <div className="mt-3">
        <SongList songs={songs} showRank={showRank} />
      </div>

      {/* 结尾哨兵 + 完成微庆祝 */}
      <div ref={endRef} className="mt-4">
        <AnimatePresence>
          {completed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-3 text-xs text-gray-300 flex items-center justify-center gap-2">
              <span>— {label}到底了 · 这些旋律，你一定都听过 —</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default function RankingsClient({ hot, liked, newest, byDecade, decadeLimit, decadeEnabled }: Props) {
  const [activeId, setActiveId] = useState('hot');
  const scrollDir   = useScrollDirection();
  const currentSong = usePlayerStore(s => s.currentSong);
  const isPlaying   = usePlayerStore(s => s.isPlaying);

  // ScrollSpy — IntersectionObserver 版
  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(`section-${s.id}`)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('section-', '');
          setActiveId(id);
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    els.forEach(el => obs.observe(el!));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  // 判断当前播放歌曲在哪个榜单哪个位置
  function getRankInChart(songs: Song[]): number | null {
    if (!currentSong || !isPlaying) return null;
    const idx = songs.findIndex(s => s.id === currentSong.id);
    return idx >= 0 ? idx + 1 : null;
  }

  const visibleSections = SECTIONS.filter(s => {
    if (s.id === 'hot')     return hot.songs.length > 0;
    if (s.id === 'liked')   return liked.songs.length > 0;
    if (s.id === 'decades') return decadeEnabled && Object.keys(byDecade).length > 0;
    if (s.id === 'newest')  return newest.songs.length > 0;
    return true;
  });

  return (
    <div className="relative flex gap-8">
      {/* ── 主内容 ────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-12">

        {/* 页面标题 + 移动端横滑Tab */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-gray-800">排行榜</h1>
            <span className="text-xs text-gray-400">数据实时更新 · 榜单可在管理端配置</span>
          </div>

          {/* 移动端 Tab — 下滑时收起 */}
          <div className={`md:hidden sticky top-16 z-30 -mx-4 px-4 transition-transform duration-300
            bg-white/90 backdrop-blur-md border-b border-gray-100
            ${scrollDir === 'down' ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
            <div className="flex overflow-x-auto gap-1 py-2 scrollbar-hide">
              {visibleSections.map(s => (
                <button key={s.id} onClick={() => scrollTo(s.id)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${activeId === s.id ? 'text-white shadow-sm' : 'text-gray-500 bg-gray-100'}`}
                  style={activeId === s.id ? { background: s.color } : {}}>
                  <span>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 热播榜 */}
        {hot.songs.length > 0 && (
          <ChartSection id="hot" label="热播榜" icon="🔥" color="rgb(239,68,68)"
            songs={hot.songs} showRank totalInSection={hot.songs.length}
            nowPlayingRank={getRankInChart(hot.songs)} />
        )}

        {/* 最受欢迎 */}
        {liked.songs.length > 0 && (
          <ChartSection id="liked" label="最受欢迎" icon="❤️" color="rgb(236,72,153)"
            songs={liked.songs} showRank totalInSection={liked.songs.length}
            nowPlayingRank={getRankInChart(liked.songs)} />
        )}

        {/* 年代精选 */}
        {decadeEnabled && Object.keys(byDecade).length > 0 && (
          <section id="section-decades" className="scroll-mt-16 space-y-6">
            <div className="sticky top-16 z-20 py-3 px-1 bg-white/80 backdrop-blur-md -mx-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎵</span>
                <h2 className="text-xl font-bold text-indigo-600">年代精选</h2>
                <span className="text-xs text-gray-400">各年代 TOP {decadeLimit}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(byDecade).map(([decade, songs]) => {
                const LABELS: Record<string, string> = { '80s': '80年代', '90s': '90年代', '00s': '2000年代', '10s': '2010年代', '20s': '2020年代' };
                return (
                  <div key={decade}>
                    <h3 className="text-base font-semibold text-indigo-500 mb-3">
                      🎵 {LABELS[decade] ?? decade}
                      <span className="text-xs text-gray-400 font-normal ml-2">TOP {decadeLimit}</span>
                    </h3>
                    <SongList songs={songs as Song[]} showRank />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 新上架 */}
        {newest.songs.length > 0 && (
          <ChartSection id="newest" label="新上架" icon="✨" color="rgb(34,197,94)"
            songs={newest.songs} showRank={false} totalInSection={newest.songs.length}
            nowPlayingRank={getRankInChart(newest.songs)} />
        )}
      </div>

      {/* ── 右侧音轨导航 (桌面端) ─────────────── */}
      <aside className="hidden lg:block w-10 shrink-0">
        <div className="sticky top-1/3 flex flex-col items-center gap-1">
          {/* 竖线 */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-200" />

          {visibleSections.map((s, i) => {
            const active = activeId === s.id;
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="group relative z-10 flex items-center gap-2 py-4"
                title={s.label}>
                {/* 节点圆点 */}
                <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
                  ${active ? 'scale-150 border-transparent' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}
                  style={active ? { background: s.color, boxShadow: `0 0 8px ${s.color}60` } : {}} />

                {/* hover 时展开文字标签 */}
                <div className="absolute left-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all
                  pointer-events-none bg-white shadow-lg rounded-lg px-2.5 py-1.5 text-xs font-medium border border-gray-100"
                  style={{ color: active ? s.color : '#6b7280' }}>
                  {s.icon} {s.label}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
