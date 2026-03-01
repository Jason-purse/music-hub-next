import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistById, addSongToPlaylist, updatePlaylist, deletePlaylist } from '@/lib/github-db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const pl = await getPlaylistById(params.id);
  if (!pl) return NextResponse.json({ error: '歌单不存在' }, { status: 404 });
  return NextResponse.json(pl);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { songId } = await req.json();
  await addSongToPlaylist(params.id, songId);
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await updatePlaylist(params.id, body);
    if (!updated) return NextResponse.json({ error: '歌单不存在' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deletePlaylist(params.id);
    if (!ok) return NextResponse.json({ error: '歌单不存在' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
