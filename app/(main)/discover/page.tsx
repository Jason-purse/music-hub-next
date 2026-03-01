'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import SongList from '@/components/SongList';
import { Song } from '@/lib/github-db';

const DECADES = ['', '80s', '90s', '00s', '10s', '20s'];

// 分类现在走 tag 过滤，与 db.json 实际 tags 对齐
const TAG_CATEGORIES = ['', '经典', '流行', '粤语', '摇滚', '情歌', '怀旧', '国风', '治愈'];
const LIMIT = 20;

export default function DiscoverPage() {
  const [decade,   setDecade]   = useState('');
  const [tag,      setTag]      = useState('');   // 改为 tag 过滤
  const [songs,    setSongs]    = useState<Song[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [hasMore,  setHasMore]  = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (p: number, d: string, t: string, replace = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String((p - 1) * LIMIT),
        sort: 'created_at',
      });
      if (d) params.set('decade', d);
      if (t) params.set('tag', t);       // tag 参数
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

  const reset = useCallback((d: string, t: string) => {
    setSongs([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, d, t, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadPage(1, '', '', true); }, [loadPage]);

  const handleDecade = (val: string) => { setDecade(val); reset(val, tag); };
  const handleTag    = (val: string) => { setTag(val);    reset(decade, val); };

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPage(nextPage, decade, tag);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, decade, tag, loadPage]);

  const pill = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm border transition cursor-pointer select-none ${
      active
        ? 'bg-indigo-500 text-white border-indigo-500'
        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-gray-600 dark:text-gray-400 dark:bg-gray-900'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">发现音乐</h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">共 {total} 首</span>
      </div>

      {/* 筛选 */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 dark:text-gray-500 w-8">年代</span>
          {DECADES.map(d => (
            <span key={d} onClick={() => handleDecade(d)} className={pill(!d ? !decade : decade === d)}>
              {d || '全部'}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 dark:text-gray-500 w-8">分类</span>
          {TAG_CATEGORIES.map(c => (
            <span key={c} onClick={() => handleTag(c)} className={pill(!c ? !tag : tag === c)}>
              {c || '全部'}
            </span>
          ))}
        </div>
      </div>

      {/* 歌曲列表 */}
      {songs.length > 0 && <SongList songs={songs} />}
      {!loading && songs.length === 0 && (
        <div className="text-center py-16 text-gray-300 dark:text-gray-600">
          <div className="text-4xl mb-3">🎵</div>
          <div>暂无相关歌曲</div>
        </div>
      )}

      {/* 无限滚动触发器 */}
      <div ref={loaderRef} className="h-8 flex items-center justify-center">
        {loading && <span className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">加载中...</span>}
        {!loading && !hasMore && songs.length > 0 && (
          <span className="text-sm text-gray-300 dark:text-gray-600">— 已加载全部 {total} 首 —</span>
        )}
      </div>
    </div>
  );
}
