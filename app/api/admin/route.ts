import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkAdminPassword, signAdminToken, verifyAdminToken } from '@/lib/auth';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'admin.json');

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {
    storage: { provider: 'local', github: { owner: '', repo: 'music-hub-files', branch: 'main' }, oss: {}, s3: {} },
    audio: { signedUrlExpiry: 1800, rateLimitPerMinute: 30 },
    disclaimer: { enabled: true, showOnFirstVisit: true, text: '本站所有音乐内容仅供个人学习、欣赏使用，不作任何商业用途。\n音乐版权归原唱片公司及艺术家所有。\n如您是版权方且认为本站内容侵犯了您的权益，请联系我们，我们将在 24 小时内删除相关内容。', contactEmail: '' },
  }; }
}

function saveConfig(cfg: any) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// POST /api/admin — 登录
export async function POST(req: NextRequest) {
  const { action, password, storage, audio, disclaimer } = await req.json();

  if (action === 'login') {
    if (!checkAdminPassword(password)) return NextResponse.json({ error: '密码错误' }, { status: 401 });
    return NextResponse.json({ token: signAdminToken() });
  }

  // 验证 token
  const token = req.headers.get('x-admin-token') || '';
  if (!verifyAdminToken(token)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const cfg = loadConfig();
  if (storage) cfg.storage = { ...cfg.storage, ...storage };
  if (audio) cfg.audio = { ...cfg.audio, ...audio };
  if (disclaimer) cfg.disclaimer = { ...cfg.disclaimer, ...disclaimer };
  saveConfig(cfg);

  return NextResponse.json({ ok: true, message: '配置已保存' });
}

// GET /api/admin — 获取配置
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token') || '';
  if (!verifyAdminToken(token)) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const cfg = loadConfig();
  return NextResponse.json(cfg);
}
