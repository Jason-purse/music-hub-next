import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'admin.json');

export async function GET() {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    return NextResponse.json(cfg.disclaimer || {});
  } catch {
    return NextResponse.json({
      enabled: true,
      showOnFirstVisit: true,
      text: '本站所有音乐内容仅供个人学习、欣赏使用，不作任何商业用途。\n音乐版权归原唱片公司及艺术家所有。\n如您是版权方且认为本站内容侵犯了您的权益，请联系我们，我们将在 24 小时内删除相关内容。',
      contactEmail: '',
    });
  }
}
