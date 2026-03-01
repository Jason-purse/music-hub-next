import crypto from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'musichub-audio-secret';

export function signAudioToken(songId: string): string {
  const exp = Date.now() + 30 * 60 * 1000; // 30分钟
  const data = `${songId}:${exp}`;
  const sig = crypto.createHmac('sha256', AUDIO_SECRET).update(data).digest('hex').slice(0, 16);
  return `${exp}.${sig}`;
}

export function verifyAudioToken(songId: string, token: string): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  try {
    const [exp, sig] = token.split('.');
    if (Date.now() > parseInt(exp)) return false;
    const data = `${songId}:${exp}`;
    const expected = crypto.createHmac('sha256', AUDIO_SECRET).update(data).digest('hex').slice(0, 16);
    return sig === expected;
  } catch { return false; }
}

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'musichub-admin-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export function signAdminToken(): string {
  const exp = Date.now() + 24 * 3600 * 1000;
  const data = JSON.stringify({ role: 'admin', exp });
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + sig;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [dataB64, sig] = token.split('.');
    const data = Buffer.from(dataB64, 'base64').toString();
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
    if (sig !== expected) return false;
    const payload = JSON.parse(data);
    return payload.exp > Date.now();
  } catch { return false; }
}

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
