'use client';
import { usePlayerStore } from '@/stores/player';
import Image from 'next/image';

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

export default function Player() {
  const { currentSong, isPlaying, currentTime, duration, volume, togglePlay, prev, next, seek, setVolume } = usePlayerStore();
  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* 封面+信息 */}
        <div className="flex items-center gap-3 w-48 md:w-64 shrink-0 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-200 to-purple-200 shrink-0 relative">
            {currentSong.cover_url && <Image src={currentSong.cover_url} alt={currentSong.title} fill className="object-cover" unoptimized />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{currentSong.title}</div>
            <div className="text-xs text-gray-400 truncate">{currentSong.artist}</div>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button onClick={prev} className="text-gray-500 hover:text-gray-800 transition text-lg">⏮</button>
            <button onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition shadow-md text-lg">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={next} className="text-gray-500 hover:text-gray-800 transition text-lg">⏭</button>
          </div>

          {/* 进度条 */}
          <div className="w-full flex items-center gap-2 max-w-lg">
            <span className="text-xs text-gray-400 w-10 text-right">{fmt(currentTime)}</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer"
              onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - rect.left) / rect.width) * 100); }}>
              <div className="h-1.5 bg-indigo-500 rounded-full transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-10">{fmt(duration)}</span>
          </div>
        </div>

        {/* 音量 */}
        <div className="hidden md:flex items-center gap-2 w-32 shrink-0">
          <span className="text-gray-400 text-sm">🔊</span>
          <input type="range" min="0" max="1" step="0.05" value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 accent-indigo-500 h-1" />
        </div>
      </div>
    </div>
  );
}
