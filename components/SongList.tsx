'use client';
import { Song } from '@/lib/github-db';
import { usePlayerStore } from '@/stores/player';
import Image from 'next/image';

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

export default function SongList({ songs }: { songs: Song[] }) {
  const play = usePlayerStore(s => s.play);
  const currentSong = usePlayerStore(s => s.currentSong);
  const isPlaying = usePlayerStore(s => s.isPlaying);

  if (!songs.length) return <div className="text-center py-8 text-gray-400">暂无歌曲</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {songs.map((song, i) => {
        const active = currentSong?.id === song.id;
        return (
          <div key={song.id} onClick={() => play(song, songs)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${active ? 'bg-indigo-50' : ''}`}>
            {/* 序号/封面 */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-200 to-purple-200 shrink-0 relative">
              {song.cover_url ? (
                <Image src={song.cover_url} alt={song.title} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex items-center justify-center h-full text-gray-400 text-xs">{i + 1}</span>
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${active ? 'text-indigo-600' : ''}`}>{song.title}</div>
              <div className="text-xs text-gray-400 truncate">{song.artist}{song.album ? ` · ${song.album}` : ''}</div>
            </div>

            {/* 时长 */}
            <div className="text-xs text-gray-400 shrink-0 flex items-center gap-2">
              {song.decade && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 text-xs">{song.decade}</span>}
              {active && isPlaying ? (
                <span className="text-indigo-500 text-xs">▶</span>
              ) : (
                <span>{song.duration ? fmt(song.duration) : '--:--'}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
