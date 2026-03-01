import { NextRequest, NextResponse } from 'next/server';
import { getSongById, incrementPlayCount } from '@/lib/github-db';
import { verifyAudioToken } from '@/lib/auth';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

const isLocal = process.env.DB_PROVIDER === 'local';

const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  let e = rateMap.get(ip);
  if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + 60000 }; rateMap.set(ip, e); }
  return ++e.count <= 30;
}

function streamFile(filePath: string, range: string | null, size: number) {
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = parseInt(s), end = e ? parseInt(e) : size - 1;
    return new Response(fs.createReadStream(filePath, { start, end }) as any, {
      status: 206,
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1) },
    });
  }
  return new Response(fs.createReadStream(filePath) as any, {
    headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(size), 'Accept-Ranges': 'bytes' },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRate(ip)) return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });

  if (process.env.NODE_ENV !== 'development' && !verifyAudioToken(params.id, req.nextUrl.searchParams.get('token') || '')) {
    return NextResponse.json({ error: '无效凭证' }, { status: 403 });
  }

  const song = await getSongById(params.id);
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
  incrementPlayCount(params.id).catch(() => {});

  const audioUrl = song.audio_url as string;
  const filename = path.basename(audioUrl);
  const range = req.headers.get('range');

  // ── Local: 直接读文件 ─────────────────────────────────────────────────────
  if (isLocal) {
    const filePath = path.join(process.cwd(), 'uploads', 'music', filename);
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    return streamFile(filePath, range, fs.statSync(filePath).size);
  }

  // ── GitHub: Octokit 下载 ──────────────────────────────────────────────────
  const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
    ...(process.env.GITHUB_API_URL ? { baseUrl: process.env.GITHUB_API_URL } : {}),
  });
  const audioPath = audioUrl.startsWith('audio/') ? audioUrl : `audio/${filename}`;
  try {
    const { data } = await octokit.repos.getContent({
      owner: process.env.STORAGE_GITHUB_OWNER || process.env.GITHUB_OWNER!,
      repo: process.env.STORAGE_GITHUB_REPO || 'music-hub-files',
      path: audioPath, ref: process.env.STORAGE_GITHUB_BRANCH || 'main',
    });
    if (Array.isArray(data) || data.type !== 'file' || !data.download_url) {
      return NextResponse.json({ error: '音频加载失败' }, { status: 502 });
    }
    const res = await fetch(data.download_url, { headers: { Authorization: `token ${process.env.GITHUB_PAT}` } });
    if (!res.ok) return NextResponse.json({ error: '音频下载失败' }, { status: 502 });
    const buf = Buffer.from(await res.arrayBuffer());
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    if (range) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = parseInt(s), end = e ? parseInt(e) : buf.length - 1;
      return new Response(ab.slice(start, end + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1) } });
    }
    return new Response(ab, { headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(buf.length), 'Accept-Ranges': 'bytes' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
