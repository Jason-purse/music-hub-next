import { NextRequest, NextResponse } from 'next/server';
import { searchSongs, getPlaylists } from '@/lib/github-db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'song';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  if (!q.trim()) return NextResponse.json({ error: '缺少搜索关键词' }, { status: 400 });

  if (type === 'playlist') {
    const playlists = await getPlaylists();
    const filtered = playlists.filter((p: any) => p.name?.includes(q) || p.description?.includes(q));
    return NextResponse.json({ playlists: filtered, total: filtered.length });
  }
  const result = await searchSongs(q, { limit, offset: (page - 1) * limit });
  return NextResponse.json({ ...result, page });
}
