import { NextRequest, NextResponse } from 'next/server';
import { getSongById, updateSong, incrementPlayCount } from '@/lib/github-db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const song = await getSongById(params.id);
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
  return NextResponse.json(song);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'play') {
      await incrementPlayCount(params.id);
      return NextResponse.json({ ok: true });
    }
    if (action === 'like') {
      const song = await getSongById(params.id);
      if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
      await updateSong(params.id, { like_count: song.like_count + 1 });
      return NextResponse.json({ ok: true, liked: true });
    }

    const updated = await updateSong(params.id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
