'use client';
import { useState, useEffect, useCallback } from 'react';

interface Song {
  id: string;
  title: string;
  artist: string;
  cover_url?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  song_ids?: string[];
  song_count?: number;
  created_at: string;
}

interface PlaylistDetail extends Playlist {
  songs: Song[];
}

function useAdminToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(localStorage.getItem('admin_token') || '');
  }, []);
  return token;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', 'x-admin-token': token };
}

export default function PlaylistsAdminPage() {
  const token = useAdminToken();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Expanded edit state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PlaylistDetail | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadPlaylists = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch('/api/playlists', { headers: { 'x-admin-token': token } });
      const d = await r.json();
      setPlaylists(d.playlists || d || []);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token !== null) loadPlaylists();
  }, [token, loadPlaylists]);

  async function createPlaylist() {
    if (!token || !newName.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/playlists', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      loadPlaylists();
    } catch {
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  }

  async function deletePlaylist(id: string, name: string) {
    if (!token || !confirm(`确认删除歌单「${name}」？`)) return;
    await fetch(`/api/playlists/${id}`, { method: 'DELETE', headers: { 'x-admin-token': token } });
    if (expandedId === id) setExpandedId(null);
    loadPlaylists();
  }

  async function openEdit(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setEditData(null);
    setSearchQ('');
    setSearchResults([]);
    setSaveMsg('');
    setEditLoading(true);
    try {
      const r = await fetch(`/api/playlists/${id}`, { headers: { 'x-admin-token': token! } });
      const d = await r.json();
      setEditData(d);
    } finally {
      setEditLoading(false);
    }
  }

  async function searchSongs() {
    if (!token || !searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}`, { headers: { 'x-admin-token': token } });
      const d = await r.json();
      setSearchResults(d.songs || d || []);
    } finally {
      setSearching(false);
    }
  }

  function addSongToEdit(song: Song) {
    if (!editData) return;
    if (editData.songs.find(s => s.id === song.id)) return;
    setEditData({ ...editData, songs: [...editData.songs, song], song_ids: [...(editData.song_ids || []), song.id] });
  }

  function removeSongFromEdit(songId: string) {
    if (!editData) return;
    setEditData({
      ...editData,
      songs: editData.songs.filter(s => s.id !== songId),
      song_ids: (editData.song_ids || []).filter(id => id !== songId),
    });
  }

  async function savePlaylist() {
    if (!token || !editData) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const r = await fetch(`/api/playlists/${editData.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          song_ids: editData.songs.map(s => s.id),
        }),
      });
      if (r.ok) {
        setSaveMsg('✅ 保存成功');
        loadPlaylists();
      } else {
        setSaveMsg('❌ 保存失败');
      }
    } catch {
      setSaveMsg('❌ 网络错误');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  if (token === null) return null;

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-3">
        <p className="text-gray-600">请先从管理后台登录</p>
        <a href="/admin" className="text-indigo-500 hover:underline text-sm">→ 前往登录</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin" className="text-sm text-gray-400 hover:text-gray-600">← 返回后台</a>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-lg">🎵 歌单管理</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + 新建歌单
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中…</div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无歌单，点击「+ 新建歌单」创建</div>
        ) : (
          playlists.map(pl => (
            <div key={pl.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 歌单行 */}
              <div className="flex items-center px-6 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{pl.name}</div>
                  <div className="text-sm text-gray-400 truncate mt-0.5">{pl.description || '暂无描述'}</div>
                </div>
                <div className="text-sm text-gray-500 shrink-0">{pl.song_count ?? 0} 首歌</div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(pl.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${expandedId === pl.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deletePlaylist(pl.id, pl.name)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-red-50 hover:bg-red-100 text-red-500 transition"
                  >
                    删除
                  </button>
                </div>
              </div>

              {/* 展开编辑区 */}
              {expandedId === pl.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 space-y-4">
                  {editLoading ? (
                    <div className="text-gray-400 text-sm py-4 text-center">加载中…</div>
                  ) : editData ? (
                    <>
                      {/* 基本信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">歌单名称</label>
                          <input
                            value={editData.name}
                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">描述</label>
                          <input
                            value={editData.description}
                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                          />
                        </div>
                      </div>

                      {/* 已有歌曲 */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-2">已有歌曲（{editData.songs.length} 首）</label>
                        {editData.songs.length === 0 ? (
                          <p className="text-sm text-gray-400">暂无歌曲</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {editData.songs.map(s => (
                              <div key={s.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                {s.cover_url && (
                                  <img src={s.cover_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                )}
                                <span className="flex-1 text-sm truncate">{s.title} - {s.artist}</span>
                                <button
                                  onClick={() => removeSongFromEdit(s.id)}
                                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                                >
                                  移除
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 搜索添加歌曲 */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-2">搜索并添加歌曲</label>
                        <div className="flex gap-2">
                          <input
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchSongs()}
                            placeholder="输入关键词搜索…"
                            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
                          />
                          <button
                            onClick={searchSongs}
                            disabled={searching}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                          >
                            {searching ? '搜索中…' : '搜索'}
                          </button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {searchResults.map(s => {
                              const already = editData.songs.find(es => es.id === s.id);
                              return (
                                <div key={s.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                  {s.cover_url && (
                                    <img src={s.cover_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                                  )}
                                  <span className="flex-1 text-sm truncate">{s.title} - {s.artist}</span>
                                  <button
                                    onClick={() => addSongToEdit(s)}
                                    disabled={!!already}
                                    className={`text-xs px-2 py-1 rounded shrink-0 transition ${already ? 'text-gray-300 cursor-default' : 'text-indigo-500 hover:bg-indigo-50'}`}
                                  >
                                    {already ? '已添加' : '+ 添加'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 保存 */}
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={savePlaylist}
                          disabled={saving}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {saving ? '保存中…' : '保存歌单'}
                        </button>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-sm text-gray-400 hover:text-gray-600"
                        >
                          取消
                        </button>
                        {saveMsg && <span className="text-sm">{saveMsg}</span>}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 新建歌单 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-lg">新建歌单</h2>
            <div>
              <label className="text-sm text-gray-500 block mb-1">歌单名称 *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="请输入歌单名称"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">描述（可选）</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="请输入歌单描述"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(false); setNewName(''); setNewDesc(''); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
              <button
                onClick={createPlaylist}
                disabled={creating || !newName.trim()}
                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {creating ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
