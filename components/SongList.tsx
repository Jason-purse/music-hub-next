'use client';
import { Song } from '@/lib/github-db';
import { usePlayerStore } from '@/stores/player';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

interface Props { songs: Song[]; showRank?: boolean; }

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 26 } },
};

export default function SongList({ songs, showRank = false }: Props) {
  const play        = usePlayerStore(s => s.play);
  const currentSong = usePlayerStore(s => s.currentSong);
  const isPlaying   = usePlayerStore(s => s.isPlaying);
  const [likes, setLikes]         = useState<Record<string, number>>({});
  const [likeAnim, setLikeAnim]   = useState<Record<string, boolean>>({});

  if (!songs.length) return <div className="text-center py-12 text-gray-300">暂无歌曲</div>;

  async function handleLike(e: React.MouseEvent, song: Song) {
    e.stopPropagation();
    setLikeAnim(prev => ({ ...prev, [song.id]: true }));
    setTimeout(() => setLikeAnim(prev => ({ ...prev, [song.id]: false })), 450);
    const res = await fetch(`/api/songs/${song.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like' }),
    });
    if (res.ok) {
      const d = await res.json();
      setLikes(prev => ({ ...prev, [song.id]: d.like_count ?? (prev[song.id] ?? 0) + 1 }));
    }
  }

  function handleDownload(e: React.MouseEvent, song: Song) {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = `/api/audio/${song.id}`;
    a.download = `${song.title} - ${song.artist}.mp3`;
    a.click();
  }

  const rankColor = (i: number) =>
    i === 0 ? 'text-yellow-500 font-bold' : i === 1 ? 'text-gray-400 font-bold' : i === 2 ? 'text-amber-600 font-bold' : 'text-gray-300 text-xs';

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {songs.map((song, i) => {
        const active    = currentSong?.id === song.id;
        const likeCount = likes[song.id] ?? song.like_count ?? 0;
        const liked     = likeCount > 0;

        return (
          <motion.div key={song.id} variants={item}
            onClick={() => play(song, songs)}
            className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0
              ${active ? 'bg-indigo-50/60' : 'hover:bg-gray-50/70'}`}>

            {/* 序号 / 播放按钮 */}
            {showRank ? (
              <div className="w-7 text-center shrink-0">
                <span className={`group-hover:hidden text-sm ${rankColor(i)}`}>{i + 1}</span>
                <span className="hidden group-hover:block text-indigo-400 text-base">▶</span>
              </div>
            ) : null}

            {/* 封面 */}
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative shadow-sm
              group-hover:shadow-md transition-shadow">
              {song.cover_url
                ? <Image src={song.cover_url} alt={song.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-gray-300">♪</div>
              }
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate transition-colors ${active ? 'text-indigo-600' : 'text-gray-800 group-hover:text-gray-900'}`}>
                <Link
                  href={`/song/${song.id}`}
                  onClick={e => e.stopPropagation()}
                  className="hover:underline"
                >
                  {song.title}
                </Link>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {song.artist}{song.album ? ` · ${song.album}` : ''}
              </div>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              {song.decade && (
                <span className="hidden sm:inline px-1.5 py-0.5 bg-gray-100 rounded-md text-gray-400 text-xs">{song.decade}</span>
              )}
              {showRank && (song.play_count || 0) > 0 && (
                <span className="hidden sm:inline text-xs text-gray-300 w-10 text-right">{song.play_count}次</span>
              )}
              {/* 点赞 */}
              <button onClick={e => handleLike(e, song)}
                className={`flex items-center gap-0.5 text-xs px-1.5 py-1 rounded-lg transition
                  ${liked ? 'text-red-400' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}
                  ${likeAnim[song.id] ? 'like-pop' : ''}`}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              {/* 下载 */}
              <button onClick={e => handleDownload(e, song)}
                className="text-gray-300 hover:text-indigo-400 text-xs px-1.5 py-1 rounded-lg hover:bg-indigo-50 transition">↓</button>
            </div>

            {/* 播放中状态 / 时长 */}
            <div className="w-12 text-right shrink-0">
              {active && isPlaying ? (
                <div className="flex items-end justify-end gap-[2px] h-3">
                  <span className="w-[2.5px] bg-indigo-400 rounded-full playing-bar playing-bar-1 h-3" />
                  <span className="w-[2.5px] bg-indigo-400 rounded-full playing-bar playing-bar-2 h-3" />
                  <span className="w-[2.5px] bg-indigo-400 rounded-full playing-bar playing-bar-3 h-3" />
                </div>
              ) : (
                <span className="text-xs text-gray-300">{song.duration ? fmt(song.duration) : '--:--'}</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
