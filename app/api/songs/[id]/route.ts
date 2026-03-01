import { NextRequest, NextResponse } from 'next/server';
import { getSongById, updateSong, incrementPlayCount, deleteSong } from '@/lib/github-db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const song = await getSongById(params.id);
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
  return NextResponse.json(song);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body.action === 'play') {
      await incrementPlayCount(params.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'like') {
      const song = await getSongById(params.id);
      if (!song) return NextResponse.json({ error: '不存在' }, { status: 404 });
      const newCount = (song.like_count || 0) + 1;
      await updateSong(params.id, { like_count: newCount });
      return NextResponse.json({ ok: true, liked: true, like_count: newCount });
    }
    const updated = await updateSong(params.id, body);
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deleteSong(params.id);
    if (!ok) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
