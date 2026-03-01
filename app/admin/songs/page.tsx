'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdminToken } from '../context';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover_url?: string;
  decade: string;
  category: string;
  tags: string | string[];
  play_count: number;
  like_count: number;
  created_at: string;
}

const DECADE_OPTIONS = ['80s', '90s', '00s', '10s', '20s'];
const CATEGORY_OPTIONS = ['经典', '华语'];
const PAGE_SIZE = 20;

function tagsToString(tags: string | string[]): string {
  if (Array.isArray(tags)) return tags.join(', ');
  return tags || '';
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', 'x-admin-token': token };
}

export default function SongsAdminPage() {
  const token = useAdminToken();
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQ, setSearchQ] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song> & { tagsStr?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadSongs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const r = await fetch(`/api/songs?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: { 'x-admin-token': token },
      });
      const d = await r.json();
      setSongs(d.songs || []);
      setTotal(d.total || 0);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    if (token) loadSongs();
  }, [token, page, loadSongs]);

  // Local filter
  const filtered = searchQ.trim()
    ? songs.filter(s => {
        const q = searchQ.toLowerCase();
        const tagsStr = tagsToString(s.tags).toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.album || '').toLowerCase().includes(q) ||
          tagsStr.includes(q)
        );
      })
    : songs;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function startEdit(song: Song) {
    if (editingId === song.id) { setEditingId(null); return; }
    setEditingId(song.id);
    setEditForm({ ...song, tagsStr: tagsToString(song.tags) });
    setSaveMsg('');
  }

  async function saveSong() {
    if (!token || !editingId) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const { tagsStr, ...rest } = editForm;
      const tags = (tagsStr || '').split(',').map(t => t.trim()).filter(Boolean);
      const r = await fetch(`/api/songs/${editingId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ ...rest, tags }),
      });
      if (r.ok) {
        setSaveMsg('✅ 保存成功');
        setEditingId(null);
        loadSongs();
      } else {
        const d = await r.json();
        setSaveMsg(`❌ ${d.error || '保存失败'}`);
      }
    } catch {
      setSaveMsg('❌ 网络错误');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  async function deleteSong(id: string, title: string) {
    if (!token || !confirm(`确认删除歌曲「${title}」？此操作不可恢复。`)) return;
    await fetch(`/api/songs/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    if (editingId === id) setEditingId(null);
    loadSongs();
  }

  if (!token) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-gray-400">请先登录</div>
    </div>
  );

  return (
    <div className="p-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-xl text-gray-800">🎵 歌曲管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">共 {total} 首</p>
        </div>
        {/* 搜索框 */}
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="搜索标题、歌手、专辑、标签…"
          className="flex-1 max-w-sm border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">加载中…</div>
      ) : (
        <>
          {saveMsg && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-white border border-gray-100 shadow-sm text-sm inline-block">
              {saveMsg}
            </div>
          )}

          {/* 歌曲列表 */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {searchQ ? '没有匹配的歌曲' : '暂无歌曲数据'}
              </div>
            ) : filtered.map(song => (
              <div key={song.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 歌曲行 */}
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* 封面 */}
                  <div className="shrink-0 w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">♪</div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">{song.title}</span>
                      <span className="text-gray-400 text-sm">-</span>
                      <span className="text-gray-500 text-sm truncate max-w-[140px]">{song.artist}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {song.decade && <span className="bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded">{song.decade}</span>}
                      {song.category && <span className="bg-purple-50 text-purple-400 px-1.5 py-0.5 rounded">{song.category}</span>}
                      <span>▶ {song.play_count || 0}</span>
                      <span>❤ {song.like_count || 0}</span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(song)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${editingId === song.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteSong(song.id, song.title)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-500 transition"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 展开编辑表单 */}
                {editingId === song.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">标题</label>
                        <input
                          value={editForm.title || ''}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">歌手</label>
                        <input
                          value={editForm.artist || ''}
                          onChange={e => setEditForm(f => ({ ...f, artist: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">专辑</label>
                        <input
                          value={editForm.album || ''}
                          onChange={e => setEditForm(f => ({ ...f, album: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">年代</label>
                        <select
                          value={editForm.decade || ''}
                          onChange={e => setEditForm(f => ({ ...f, decade: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          <option value="">— 请选择 —</option>
                          {DECADE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">分类</label>
                        <select
                          value={editForm.category || ''}
                          onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          <option value="">— 请选择 —</option>
                          {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">标签（逗号分隔）</label>
                        <input
                          value={editForm.tagsStr || ''}
                          onChange={e => setEditForm(f => ({ ...f, tagsStr: e.target.value }))}
                          placeholder="如：粤语, 情歌, 经典"
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={saveSong}
                        disabled={saving}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        {saving ? '保存中…' : '保存'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-gray-400 hover:text-gray-600"
                      >
                        取消
                      </button>
                      {saveMsg && <span className="text-sm">{saveMsg}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 分页（仅无搜索时显示） */}
          {!searchQ && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition"
              >
                ← 上一页
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pg: number;
                  if (totalPages <= 7) {
                    pg = i + 1;
                  } else if (page <= 4) {
                    pg = i + 1;
                  } else if (page >= totalPages - 3) {
                    pg = totalPages - 6 + i;
                  } else {
                    pg = page - 3 + i;
                  }
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-lg text-sm transition ${page === pg ? 'bg-indigo-500 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                    >
                      {pg}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 transition"
              >
                下一页 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
