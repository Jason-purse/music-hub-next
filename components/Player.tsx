'use client';
import { usePlayerStore } from '@/stores/player';
import Image from 'next/image';
import { useEffect, useState } from 'react';

function extractColor(src: string): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        const [r, g, b] = [d[0], d[1], d[2]];
        resolve(`${r},${g},${b}`);
      } catch { resolve('99,102,241'); }
    };
    img.onerror = () => resolve('99,102,241');
    img.src = src;
  });
}

function fmt(s: number) {
  if (!s || isNaN(s)) return '--:--';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function Player() {
  const { currentSong, isPlaying, currentTime, duration, volume,
          togglePlay, prev, next, seek, setVolume } = usePlayerStore();

  const [color, setColor]   = useState('99,102,241');
  const [liked, setLiked]   = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  // 封面主色提取
  useEffect(() => {
    if (currentSong?.cover_url) {
      extractColor(currentSong.cover_url).then(setColor);
    } else {
      setColor('99,102,241');
    }
    setLiked(false);
  }, [currentSong?.id]);

  const handleLike = async () => {
    setLiked(true); setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 450);
    if (currentSong) {
      fetch(`/api/songs/${currentSong.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      }).catch(() => {});
    }
  };

  // 进度条点击 → seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect  = e.currentTarget.getBoundingClientRect();
    const pct   = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  if (!currentSong) return null;

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* 全局背景色晕染 */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
        style={{ background: `radial-gradient(ellipse 70% 50% at 50% 110%, rgba(${color},0.15), transparent)` }} />

      {/* 悬浮胶囊播放器 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-24px)] md:max-w-3xl md:rounded-2xl md:border">
        <div className="relative bg-white/82 backdrop-blur-2xl rounded-none md:rounded-2xl
          border border-white/60
          shadow-[0_8px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
          px-3 py-3 md:px-4 md:py-3 flex items-center gap-2 md:gap-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>

          {/* 封面 */}
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
            {currentSong.cover_url
              ? <Image src={currentSong.cover_url} alt={currentSong.title} fill className="object-cover" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-xl"
                  style={{ background: `rgba(${color},0.2)` }}>♪</div>
            }
          </div>

          {/* 歌曲信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3 shrink-0">
                  <span className="w-[2.5px] rounded-full playing-bar playing-bar-1 h-3"
                    style={{ backgroundColor: `rgb(${color})` }} />
                  <span className="w-[2.5px] rounded-full playing-bar playing-bar-2 h-3"
                    style={{ backgroundColor: `rgb(${color})` }} />
                  <span className="w-[2.5px] rounded-full playing-bar playing-bar-3 h-3"
                    style={{ backgroundColor: `rgb(${color})` }} />
                </div>
              )}
              <span className="text-sm font-medium text-gray-800 truncate">{currentSong.title}</span>
            </div>
            <div className="text-xs text-gray-400 truncate">{currentSong.artist}</div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
            {/* 上一首 */}
            <button onClick={prev}
              className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>

            {/* 播放/暂停 */}
            <button onClick={togglePlay}
              className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-xl text-white shadow-md transition active:scale-95"
              style={{ background: `linear-gradient(135deg,rgba(${color},0.92),rgba(${color},0.7))` }}>
              {isPlaying
                ? <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg className="w-5 h-5 md:w-4 md:h-4 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>

            {/* 下一首 */}
            <button onClick={next}
              className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-5 h-5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>

            {/* 点赞 */}
            <button onClick={handleLike}
              className={`w-11 h-11 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition ${likeAnim ? 'like-pop' : ''}`}
              style={liked ? { color: `rgb(${color})` } : undefined}>
              <svg className={`w-5 h-5 md:w-4 md:h-4 ${!liked ? 'text-gray-300 hover:text-red-400' : ''}`}
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* 时间 */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 text-xs text-gray-400 tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span className="text-gray-200">/</span>
            <span>{fmt(duration)}</span>
          </div>

          {/* 音量 — 直接调 store.setVolume，同步到单例 Audio */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range" min={0} max={1} step={0.02}
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* 进度条（胶囊底部极细线）- 移动端加大触摸区域 */}
          <div className="absolute bottom-0 left-0 right-0 h-3 md:h-[3px] bg-gray-100 rounded-full overflow-hidden cursor-pointer group/prog"
            onClick={handleSeek}>
            <div className="h-full md:h-full rounded-full transition-all duration-150 group-hover/prog:opacity-80"
              style={{ width: `${pct}%`, background: `rgb(${color})` }} />
          </div>
        </div>
      </div>

      {/* 胶囊占位高度 */}
      <div className="h-20 md:h-24" />
    </>
  );
}
