import { getSongs, getPlaylists } from '@/lib/github-db';
import SongList from '@/components/SongList';
import PlaylistGrid from '@/components/PlaylistGrid';
import Link from 'next/link';

export const revalidate = 60; // ISR: 每60秒重新生成

export default async function HomePage() {
  const [{ songs: latest, total }, { songs: hot }, playlists] = await Promise.all([
    getSongs({ limit: 10, sort: 'created_at' }),
    getSongs({ limit: 10, sort: 'play_count' }),
    getPlaylists(),
  ]);

  return (
    <div className="space-y-8">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">欢迎来到 MusicHub</h1>
        <p className="text-white/80 text-sm md:text-base">发现经典华语音乐，重温80-90年代的美好旋律</p>
        <div className="flex gap-3 mt-4">
          <Link href="/discover" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">开始探索</Link>
          <Link href="/rankings" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">排行榜</Link>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '全部歌曲', value: total },
          { label: '歌单数量', value: playlists.length },
          { label: '80年代经典', value: latest.filter(s => s.decade === '80s').length },
          { label: '90年代经典', value: latest.filter(s => s.decade === '90s').length },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-indigo-600">{item.value}</div>
            <div className="text-sm text-gray-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 最新上架 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">最新上架</h2>
          <Link href="/discover" className="text-indigo-500 text-sm hover:underline">查看更多</Link>
        </div>
        <SongList songs={latest} />
      </section>

      {/* 热门歌曲 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">热门歌曲</h2>
          <Link href="/rankings" className="text-indigo-500 text-sm hover:underline">查看更多</Link>
        </div>
        <SongList songs={hot} />
      </section>

      {/* 推荐歌单 */}
      {playlists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">推荐歌单</h2>
            <Link href="/playlists" className="text-indigo-500 text-sm hover:underline">查看更多</Link>
          </div>
          <PlaylistGrid playlists={playlists.slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
