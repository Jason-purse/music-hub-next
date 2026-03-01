'use client';
import { Playlist } from '@/lib/github-db';
import Link from 'next/link';
import Image from 'next/image';

export default function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  if (!playlists.length) return <div className="text-center py-8 text-gray-400">暂无歌单</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {playlists.map(pl => (
        <Link key={pl.id} href={`/playlist/${pl.id}`}
          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition group">
          <div className="aspect-square bg-gradient-to-br from-indigo-400 to-purple-500 relative">
            {pl.cover_url && <Image src={pl.cover_url} alt={pl.name} fill className="object-cover" unoptimized />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
              <span className="text-white text-3xl opacity-50 group-hover:opacity-100 transition">▶</span>
            </div>
          </div>
          <div className="p-3">
            <div className="font-medium text-sm truncate">{pl.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{pl.song_count ?? (pl as any).song_ids?.length ?? 0} 首歌曲</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
