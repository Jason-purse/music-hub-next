import { NextRequest, NextResponse } from 'next/server';
import { getPlaylists, createPlaylist } from '@/lib/github-db';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const playlists = await getPlaylists();
    const paged = playlists.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ playlists: paged, total: playlists.length, page });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pl = await createPlaylist({ id: randomUUID(), ...body });
    return NextResponse.json(pl, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
