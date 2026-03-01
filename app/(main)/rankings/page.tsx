import { getSongs } from '@/lib/github-db';
import SongList from '@/components/SongList';

export const revalidate = 300;

export default async function RankingsPage() {
  const [{ songs: hot }, { songs: fresh }] = await Promise.all([
    getSongs({ limit: 20, sort: 'play_count' }),
    getSongs({ limit: 20, sort: 'created_at' }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">排行榜</h1>
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🔥</span> 热播榜
        </h2>
        <SongList songs={hot} />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">✨</span> 最新上架
        </h2>
        <SongList songs={fresh} />
      </section>
    </div>
  );
}
