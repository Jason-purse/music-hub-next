import { getSongs } from '@/lib/github-db';
import SongList from '@/components/SongList';

export const revalidate = 60;

const DECADES = ['', '80s', '90s', '00s', '10s', '20s'];
const CATEGORIES = ['', '粤语', '国语', '摇滚', '流行', '抒情', '民谣'];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { decade?: string; category?: string; page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const limit = 30;
  const { songs, total } = await getSongs({ limit, offset: (page - 1) * limit, sort: 'created_at' });

  const filtered = songs.filter(s =>
    (!searchParams.decade || s.decade === searchParams.decade) &&
    (!searchParams.category || s.category === searchParams.category)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">发现音乐</h1>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-1">年代：</span>
        {DECADES.map(d => (
          <a key={d} href={`/discover?${new URLSearchParams({ ...searchParams, decade: d }).toString()}`}
            className={`px-3 py-1 rounded-full text-sm border transition ${searchParams.decade === d || (!d && !searchParams.decade) ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}>
            {d || '全部'}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-500 self-center mr-1">分类：</span>
        {CATEGORIES.map(c => (
          <a key={c} href={`/discover?${new URLSearchParams({ ...searchParams, category: c }).toString()}`}
            className={`px-3 py-1 rounded-full text-sm border transition ${searchParams.category === c || (!c && !searchParams.category) ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 hover:border-indigo-300 text-gray-600'}`}>
            {c || '全部'}
          </a>
        ))}
      </div>

      <div className="text-sm text-gray-500">共 {total} 首歌曲</div>
      <SongList songs={filtered} />
    </div>
  );
}
