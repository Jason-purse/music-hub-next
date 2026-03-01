import { NextRequest, NextResponse } from 'next/server';
import { getSongs, createSong } from '@/lib/github-db';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'created_at';
    const offset = (page - 1) * limit;

    const result = await getSongs({ limit, offset, sort });
    return NextResponse.json({ ...result, page });
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
