import { NextRequest, NextResponse } from 'next/server';
import { getSongById, incrementPlayCount } from '@/lib/github-db';
import { verifyAudioToken } from '@/lib/auth';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

// Rate limiting
const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string, limit = 30): boolean {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60000 };
    rateMap.set(ip, entry);
  }
  return ++entry.count <= limit;
}

// 从 GitHub 私有仓库拉取音频流
async function fetchFromGitHub(audioPath: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
  const owner = process.env.STORAGE_GITHUB_OWNER || process.env.GITHUB_OWNER!;
  const repo = process.env.STORAGE_GITHUB_REPO || 'music-hub-files';
  const branch = process.env.STORAGE_GITHUB_BRANCH || 'main';

  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: audioPath, ref: branch });
    if (Array.isArray(data) || data.type !== 'file') return null;
    // GitHub API 返回 base64 编码内容（仅适用于 < 1MB 的文件）
    // 大文件需要用 download_url
    if (data.size > 900_000 && data.download_url) {
      // 用 PAT 请求 raw URL
      const res = await fetch(data.download_url, {
        headers: { Authorization: `token ${process.env.GITHUB_PAT}` },
      });
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      return { buffer, contentType: 'audio/mpeg' };
    }
    const buffer = Buffer.from(data.content, 'base64');
    return { buffer, contentType: 'audio/mpeg' };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRate(ip)) return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });

  const token = req.nextUrl.searchParams.get('token') || '';
  if (process.env.NODE_ENV !== 'development' && !verifyAudioToken(params.id, token)) {
    return NextResponse.json({ error: '无效的播放凭证' }, { status: 403 });
  }

  const song = await getSongById(params.id);
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });

  // 异步增加播放计数
  incrementPlayCount(params.id).catch(() => {});

  const audioUrl = song.audio_url;

  // ─── 1. GitHub 私有仓库（audio/xxx.mp3 格式）─────────────────────────
  if (process.env.STORAGE_PROVIDER === 'github' || audioUrl.startsWith('audio/')) {
    const audioPath = audioUrl.startsWith('audio/') ? audioUrl : `audio/${audioUrl.split('/').pop()}`;
    const result = await fetchFromGitHub(audioPath);
    if (!result) return NextResponse.json({ error: '音频加载失败' }, { status: 502 });

    const range = req.headers.get('range') || '';
    const { buffer } = result;
    // 转为 ArrayBuffer（Edge Runtime 兼容）
    const ab: ArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    if (range) {
      const [startStr, endStr] = range.replace('bytes=', '').split('-');
      const start = parseInt(startStr);
      const end = endStr ? parseInt(endStr) : buffer.length - 1;
      return new Response(ab.slice(start, end + 1), {
        status: 206,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new Response(ab, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // ─── 2. 本地文件（/uploads/music/xxx.mp3）────────────────────────────
  if (audioUrl.startsWith('/uploads/')) {
    // 兼容 Vue 项目路径
    const candidates = [
      path.join(process.cwd(), '..', 'music-hub', 'server', audioUrl),
      path.join(process.cwd(), 'server', audioUrl),
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) return NextResponse.json({ error: '本地文件不存在' }, { status: 404 });

    const stat = fs.statSync(filePath);
    const range = req.headers.get('range') || '';

    if (range) {
      const [startStr, endStr] = range.replace('bytes=', '').split('-');
      const start = parseInt(startStr);
      const end = endStr ? parseInt(endStr) : stat.size - 1;
      const stream = fs.createReadStream(filePath, { start, end });
      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(end - start + 1),
        },
      });
    }

    return new NextResponse(fs.createReadStream(filePath) as any, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // ─── 3. S3/OSS 预签名 URL / 外部 URL ────────────────────────────────
  // 对于 R2/OSS，audio_url 已经是可访问 URL，直接重定向
  if (audioUrl.startsWith('http')) {
    return NextResponse.redirect(audioUrl);
  }

  return NextResponse.json({ error: '不支持的音频类型' }, { status: 400 });
}
