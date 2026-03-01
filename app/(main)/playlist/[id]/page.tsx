import { getPlaylistById } from '@/lib/github-db';
import SongList from '@/components/SongList';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default async function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const pl = await getPlaylistById(params.id);
  if (!pl) notFound();

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shrink-0 relative overflow-hidden">
          {pl.cover_url && <Image src={pl.cover_url} alt={pl.name} fill className="object-cover" unoptimized />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{pl.name}</h1>
          {pl.description && <p className="text-gray-500 text-sm mt-1">{pl.description}</p>}
          <p className="text-sm text-gray-400 mt-2">{pl.songs.length} 首歌曲</p>
        </div>
      </div>
      <SongList songs={pl.songs} />
    </div>
  );
}
