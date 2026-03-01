import { NextRequest, NextResponse } from 'next/server';
import { getSongById } from '@/lib/github-db';
import { signAudioToken } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const song = await getSongById(params.id);
  if (!song) return NextResponse.json({ error: '歌曲不存在' }, { status: 404 });
  const token = signAudioToken(params.id);
  return NextResponse.json({ token, expiresIn: 1800 });
}
