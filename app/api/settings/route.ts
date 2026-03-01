import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveSettings } from '@/lib/db/index';
import { DEFAULT_SETTINGS, SiteSettings } from '@/lib/db/types';
import { verifyAdminToken } from '@/lib/auth';

export async function GET() {
  const db = await getDB();
  const settings = db.settings ?? DEFAULT_SETTINGS;
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('x-admin-token') || '';
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const body: SiteSettings = await req.json();
    await saveSettings(body);
    return NextResponse.json({ ok: true, settings: body });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
