import { getPlaylists } from '@/lib/github-db';
import PlaylistGrid from '@/components/PlaylistGrid';

export const revalidate = 60;

export default async function PlaylistsPage() {
  const playlists = await getPlaylists();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">歌单</h1>
      <PlaylistGrid playlists={playlists} />
    </div>
  );
}
