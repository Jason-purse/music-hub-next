import { NextRequest, NextResponse } from 'next/server';
import { getPlaylists, createPlaylist } from '@/lib/github-db';
import { randomUUID } from 'crypto';

export async function GET() {
  const playlists = await getPlaylists();
  return NextResponse.json({ playlists, total: playlists.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pl = await createPlaylist({ id: randomUUID(), ...body });
  return NextResponse.json(pl, { status: 201 });
}
