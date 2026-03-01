'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SongList from '@/components/SongList';
import { Song } from '@/lib/github-db';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (!query) return;
    setQ(query);
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=30`)
      .then(r => r.json())
      .then(d => { setSongs(d.songs || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索歌曲、歌手..."
          className="w-full h-12 px-5 text-base bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 shadow-sm dark:shadow-none transition text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600" />
      </form>

      {loading && <div className="text-center text-gray-400 dark:text-gray-500 py-8">搜索中...</div>}

      {!loading && total > 0 && (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400">找到 {total} 首歌曲</div>
          <SongList songs={songs} />
        </>
      )}

      {!loading && q && total === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <div className="text-4xl mb-3">🎵</div>
          <div>没有找到「{q}」相关歌曲</div>
        </div>
      )}

      {!q && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <div>输入歌名或歌手名开始搜索</div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400 dark:text-gray-500">加载中...</div>}>
      <SearchContent />
    </Suspense>
  );
}
