import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db/index';
import { createSong } from '@/lib/github-db';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit    = parseInt(searchParams.get('limit')  || '20');
    const offset   = parseInt(searchParams.get('offset') || '0') ||
                     (parseInt(searchParams.get('page') || '1') - 1) * limit;
    const sort     = searchParams.get('sort')     || 'created_at';
    const decade   = searchParams.get('decade')   || '';
    const category = searchParams.get('category') || '';
    const tag      = searchParams.get('tag')      || '';  // 按 tag 过滤（支持粤语/流行等细分）

    const db = await getDB();
    let songs = [...db.songs];

    // 服务端筛选
    if (decade)   songs = songs.filter(s => s.decade   === decade);
    if (category) songs = songs.filter(s => s.category === category);
    if (tag) songs = songs.filter(s => {
      const tags = Array.isArray(s.tags) ? s.tags : String(s.tags || '').split(',').map(t => t.trim());
      return tags.some(t => t.toLowerCase() === tag.toLowerCase());
    });

    // 排序
    if (sort === 'play_count')  songs.sort((a, b) => b.play_count - a.play_count);
    else if (sort === 'like_count') songs.sort((a, b) => b.like_count - a.like_count);
    else songs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = songs.length;
    return NextResponse.json({
      songs: songs.slice(offset, offset + limit),
      total,
      page: Math.floor(offset / limit) + 1,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const song = await createSong({ id: randomUUID(), ...body });
    return NextResponse.json(song, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
