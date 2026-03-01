import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistById, addSongToPlaylist } from '@/lib/github-db';

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
