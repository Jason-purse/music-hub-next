'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SongList from '@/components/SongList';
import { Song } from '@/lib/github-db';

const DECADES    = ['', '80s', '90s', '00s', '10s', '20s'];
const CATEGORIES = ['', '经典', '粤语', '国语', '摇滚', '流行', '抒情', '民谣'];
const LIMIT = 20;

export default function DiscoverPage() {
  const [decade,   setDecade]   = useState('');
  const [category, setCategory] = useState('');
  const [songs,    setSongs]    = useState<Song[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [hasMore,  setHasMore]  = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // 重置并加载第一页
  const reset = useCallback((d: string, c: string) => {
    setSongs([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, d, c, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPage = useCallback(async (p: number, d: string, c: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String((p - 1) * LIMIT),
        sort: 'created_at',
      });
      if (d) params.set('decade', d);
      if (c) params.set('category', c);
      const res  = await fetch(`/api/songs?${params}`);
      const data = await res.json();
      const list: Song[] = data.songs || [];
      setSongs(prev => replace ? list : [...prev, ...list]);
      setTotal(data.total || 0);
      setHasMore(list.length === LIMIT);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初次加载
  useEffect(() => { loadPage(1, '', '', true); }, [loadPage]);

  // 筛选变化
  const handleFilter = (type: 'decade' | 'category', val: string) => {
    const d = type === 'decade'   ? val : decade;
    const c = type === 'category' ? val : category;
    if (type === 'decade')   setDecade(val);
    if (type === 'category') setCategory(val);
    reset(d, c);
  };

  // IntersectionObserver 触底加载
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPage(nextPage, decade, category);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, decade, category, loadPage]);

  const pill = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition cursor-pointer select-none ${
      active ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 hover:border-indigo-300 text-gray-600'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">发现音乐</h1>
        <span className="text-sm text-gray-400">共 {total} 首</span>
      </div>

      {/* 筛选 */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 w-8">年代</span>
          {DECADES.map(d => (
            <span key={d} onClick={() => handleFilter('decade', d)} className={pill(!d ? !decade : decade === d)}>
              {d || '全部'}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 w-8">分类</span>
          {CATEGORIES.map(c => (
            <span key={c} onClick={() => handleFilter('category', c)} className={pill(!c ? !category : category === c)}>
              {c || '全部'}
            </span>
          ))}
        </div>
      </div>

      {/* 歌曲列表 */}
      {songs.length > 0 && <SongList songs={songs} />}

      {/* 无限滚动触发器 */}
      <div ref={loaderRef} className="h-8 flex items-center justify-center">
        {loading && <span className="text-sm text-gray-400 animate-pulse">加载中...</span>}
        {!loading && !hasMore && songs.length > 0 && (
          <span className="text-sm text-gray-300">— 已加载全部 {total} 首 —</span>
        )}
      </div>
    </div>
  );
}
