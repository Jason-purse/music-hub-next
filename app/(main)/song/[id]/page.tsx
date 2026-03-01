'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { usePlayerStore } from '@/stores/player'

interface AiAnalysis {
  mood: string
  energy: string
  tempo: string
  genres: string[]
  era_context: string
  listen_scene: string
  summary: string
  analyzed_at: string
}

interface Song {
  id: string
  title: string
  artist: string
  album: string
  cover_url: string
  duration: number
  decade: string
  category: string
  tags: string | string[]
  play_count: number
  like_count: number
  created_at: string
  ai_analysis?: AiAnalysis
  lyrics?: string
}

function AiAnalysisCard({ songId, initial }: { songId: string; initial?: AiAnalysis }) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(initial || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function doAnalyze(force = false) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/songs/${songId}/analyze${force ? '?force=1' : ''}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析失败')
      setAnalysis(data.analysis)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const energyColor = { 低: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', 中: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', 高: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' }
  const tempoColor = { 慢: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400', 中等: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', 快: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">AI 音乐分析</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">by MiniMax M2.5</span>
      </div>

      {!analysis && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎵</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">让 AI 分析这首歌的情绪、节奏和文化背景</p>
          <button
            onClick={() => doAnalyze()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-95 transition"
          >
            开始分析
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">AI 分析中…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-3">
          {error}
          <button onClick={() => doAnalyze()} className="ml-2 underline">重试</button>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          {/* 一句话总结 */}
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic border-l-4 border-indigo-200 dark:border-indigo-700 pl-3">
            {analysis.summary}
          </p>

          {/* 标签行 */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${energyColor[analysis.energy as keyof typeof energyColor] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              ⚡ {analysis.energy}能量
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${tempoColor[analysis.tempo as keyof typeof tempoColor] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              🥁 {analysis.tempo}节奏
            </span>
            {analysis.genres.map(g => (
              <span key={g} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                🎸 {g}
              </span>
            ))}
          </div>

          {/* 情绪 */}
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">情绪</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">{analysis.mood}</div>
          </div>

          {/* 年代背景 */}
          <div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">年代背景</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{analysis.era_context}</div>
          </div>

          {/* 场景 */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/10 rounded-xl px-4 py-3">
            <span>🌙</span>
            <span>适合：{analysis.listen_scene}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              分析于 {new Date(analysis.analyzed_at).toLocaleDateString('zh-CN')}
            </span>
            <button
              onClick={() => doAnalyze(true)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              重新分析
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const play = usePlayerStore(s => s.play)
  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/songs/${id}`)
      .then(r => r.json())
      .then(data => { setSong(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const tags = song ? (Array.isArray(song.tags) ? song.tags : String(song.tags || '').split(',').filter(Boolean)) : []

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 dark:text-gray-500">加载中…</div>
    </div>
  )

  if (!song) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🎵</div>
        <div className="text-gray-500 dark:text-gray-400">歌曲不存在</div>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm">← 返回</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 返回 */}
      <button onClick={() => router.back()} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-sm flex items-center gap-1 mb-6">
        ← 返回
      </button>

      {/* 歌曲主卡片 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm dark:shadow-none mb-4">
        <div className="flex gap-5 items-start">
          {/* 封面 */}
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 shadow-sm">
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🎵</div>
            )}
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{song.title}</h1>
            <div className="text-gray-500 dark:text-gray-400 text-sm mb-3">{song.artist}
              {song.album && <span className="text-gray-400 dark:text-gray-500"> · {song.album}</span>}
            </div>

            {/* 元数据 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {song.decade && (
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium">
                  {song.decade}
                </span>
              )}
              {song.category && (
                <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium">
                  {song.category}
                </span>
              )}
              <span className="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs">
                ⏱ {formatDuration(song.duration || 0)}
              </span>
            </div>

            {/* 统计 */}
            <div className="flex gap-4 text-sm text-gray-400 dark:text-gray-500">
              <span>▶ {song.play_count || 0} 次播放</span>
              <span>♥ {song.like_count || 0} 喜欢</span>
            </div>
          </div>
        </div>

        {/* 播放按钮 */}
        <button
          onClick={() => play(song as any)}
          className="mt-5 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <span className="text-lg">▶</span> 立即播放
        </button>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
            {tags.map(t => (
              <span key={t} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* AI 分析卡片 */}
      <AiAnalysisCard songId={song.id} initial={song.ai_analysis} />
    </div>
  )
}
