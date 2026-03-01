/**
 * app/api/songs/[id]/analyze/route.ts
 *
 * POST /api/songs/:id/analyze
 * 用 MiniMax M2.5 对歌曲做 AI 分析，结果写入 db.json song.ai_analysis
 * 幂等：已分析过则直接返回缓存结果（除非 ?force=1）
 */
import { NextResponse } from 'next/server'
import { getDB, updateSong } from '@/lib/db/index'
import type { AiAnalysis } from '@/lib/db/types'

const MINIMAX_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_HOST = process.env.MINIMAX_API_HOST || 'https://api.minimaxi.com'

async function callMiniMax(prompt: string): Promise<string> {
  if (!MINIMAX_KEY) throw new Error('MINIMAX_API_KEY 未配置')

  const res = await fetch(`${MINIMAX_HOST}/v1/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_KEY}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的华语音乐评论人，熟悉80年代至今的华语流行、粤语、国语音乐。用简洁的中文回答，输出 JSON 格式。',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MiniMax API 错误: ${res.status} - ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

function buildPrompt(title: string, artist: string, album: string, decade: string, duration: number): string {
  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  return `请分析这���歌曲，输出严格的 JSON 格式，不要有任何其他文字：

歌名：${title}
歌手：${artist}
专辑：${album || '未知'}
年代：${decade}
时长：${mins}分${secs}秒

输出 JSON（所有字段都必须是字符串或字符串数组）：
{
  "mood": "2-4个情绪标签，如：抒情、怀旧、温暖",
  "energy": "低 或 中 或 高",
  "tempo": "慢 或 中等 或 快",
  "genres": ["曲风1", "曲风2"],
  "era_context": "这首歌的年代背景和文化意义，一两句话",
  "listen_scene": "适合在什么场景听，如：睡前、驾车、雨天",
  "summary": "一句话介绍这首歌的特点和魅力"
}`
}

function parseAnalysis(raw: string): AiAnalysis | null {
  try {
    // 提取 JSON 块（有时模型会加多余文字）
    const match = raw.match(/\{[\s\S]+\}/)
    if (!match) return null
    const obj = JSON.parse(match[0])
    return {
      mood: String(obj.mood || ''),
      energy: String(obj.energy || '中'),
      tempo: String(obj.tempo || '中等'),
      genres: Array.isArray(obj.genres) ? obj.genres.map(String) : [String(obj.genres || '')],
      era_context: String(obj.era_context || ''),
      listen_scene: String(obj.listen_scene || ''),
      summary: String(obj.summary || ''),
      analyzed_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const force = searchParams.get('force') === '1'

    const db = await getDB()
    const song = db.songs.find(s => s.id === params.id)
    if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 })

    // 已分析过且不强制刷新 → 直接返回缓存
    if (song.ai_analysis && !force) {
      return NextResponse.json({ ok: true, cached: true, analysis: song.ai_analysis })
    }

    const prompt = buildPrompt(
      song.title, song.artist, song.album || '',
      song.decade || '', song.duration || 0
    )

    const raw = await callMiniMax(prompt)
    const analysis = parseAnalysis(raw)

    if (!analysis) {
      return NextResponse.json(
        { error: 'AI 返回格式解析失败', raw: raw.slice(0, 300) },
        { status: 502 }
      )
    }

    // 写入 db.json
    await updateSong(params.id, { ai_analysis: analysis })

    return NextResponse.json({ ok: true, cached: false, analysis })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDB()
  const song = db.songs.find(s => s.id === params.id)
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 })
  return NextResponse.json({ analysis: song.ai_analysis || null })
}
