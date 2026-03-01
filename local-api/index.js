/**
 * local-api/index.js
 * 本地 GitHub Contents API Mock Server
 *
 * 完全模拟 GitHub API，让 lib/github-db.ts 和 lib/storage/github.js
 * 在本地开发时无需任何改动，只需把 GITHUB_API_URL 指向此服务器。
 *
 * 实现的端点：
 *   GET  /repos/:owner/:repo/contents/*    → 读文件（返回 base64）
 *   PUT  /repos/:owner/:repo/contents/*    → 写文件（接受 base64）
 *   GET  /raw/:owner/:repo/:branch/*       → 直接下载原始文件（模拟 raw.githubusercontent.com）
 *   GET  /_health                          → 健康检查
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '100mb' }));

const PORT = process.env.LOCAL_API_PORT || 10002;
// 数据根目录：local-api/data/{owner}/{repo}/{branch}/
const DATA_ROOT = path.join(__dirname, 'data');
// 音频文件目录（复用 uploads/music/）
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'music');

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function repoDir(owner, repo, branch = 'main') {
  return path.join(DATA_ROOT, owner, repo, branch);
}

function filePath(owner, repo, branch, filePath_) {
  // 安全：防止路径穿越
  const base = repoDir(owner, repo, branch);
  const full = path.join(base, filePath_);
  if (!full.startsWith(base)) throw new Error('路径非法');
  return full;
}

function sha1(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

function makeFileResponse(owner, repo, branch, filePath_, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const base64 = buf.toString('base64');
  const name = path.basename(filePath_);
  const ext = path.extname(name).slice(1) || 'json';
  const mimeMap = { json: 'application/json', mp3: 'audio/mpeg', jpg: 'image/jpeg', png: 'image/png' };

  return {
    type: 'file',
    name,
    path: filePath_,
    sha: sha1(buf),
    size: buf.length,
    url: `http://localhost:${PORT}/repos/${owner}/${repo}/contents/${filePath_}?ref=${branch}`,
    download_url: `http://localhost:${PORT}/raw/${owner}/${repo}/${branch}/${filePath_}`,
    content: base64,
    encoding: 'base64',
  };
}

// ─── 日志 ────────────────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ─── 健康检查 ────────────────────────────────────────────────────────────────

app.get('/_health', (req, res) => {
  res.json({ ok: true, server: 'MusicHub Local GitHub API Mock', port: PORT });
});

// ─── GET 读文件 ───────────────────────────────────────────────────────────────

app.get('/repos/:owner/:repo/contents/*', (req, res) => {
  try {
    const { owner, repo } = req.params;
    const filePath_ = req.params[0];                       // wildcard 后的路径
    const branch = req.query.ref || 'main';
    const full = filePath(owner, repo, branch, filePath_);

    if (!fs.existsSync(full)) {
      return res.status(404).json({ message: 'Not Found', documentation_url: '' });
    }
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      // 返回目录列表
      const entries = fs.readdirSync(full).map(name => ({
        type: fs.statSync(path.join(full, name)).isDirectory() ? 'dir' : 'file',
        name,
        path: path.join(filePath_, name),
      }));
      return res.json(entries);
    }
    const content = fs.readFileSync(full);
    res.json(makeFileResponse(owner, repo, branch, filePath_, content));
  } catch (e) {
    console.error('GET error:', e.message);
    res.status(500).json({ message: e.message });
  }
});

// ─── PUT 写文件 ───────────────────────────────────────────────────────────────

app.put('/repos/:owner/:repo/contents/*', (req, res) => {
  try {
    const { owner, repo } = req.params;
    const filePath_ = req.params[0];
    const branch = req.body.branch || 'main';
    const { message, content, sha } = req.body;

    if (!content) return res.status(400).json({ message: '缺少 content 字段' });

    const full = filePath(owner, repo, branch, filePath_);
    fs.mkdirSync(path.dirname(full), { recursive: true });

    const buf = Buffer.from(content, 'base64');
    fs.writeFileSync(full, buf);

    const fileRes = makeFileResponse(owner, repo, branch, filePath_, buf);
    res.status(200).json({
      content: fileRes,
      commit: { message: message || 'update', sha: sha1(buf).slice(0, 40) },
    });
    console.log(`  ✅ 写入 ${filePath_} (${buf.length} bytes)`);
  } catch (e) {
    console.error('PUT error:', e.message);
    res.status(500).json({ message: e.message });
  }
});

// ─── GET 原始文件下载（模拟 raw.githubusercontent.com）────────────────────────

app.get('/raw/:owner/:repo/:branch/*', (req, res) => {
  try {
    const { owner, repo, branch } = req.params;
    const filePath_ = req.params[0];
    const full = filePath(owner, repo, branch, filePath_);

    if (!fs.existsSync(full)) {
      // 如果是 audio/ 路径，尝试从 uploads/music/ 目录找
      if (filePath_.startsWith('audio/')) {
        const filename = path.basename(filePath_);
        const audioFile = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(audioFile)) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Accept-Ranges', 'bytes');
          return fs.createReadStream(audioFile).pipe(res);
        }
      }
      return res.status(404).send('Not Found');
    }

    const ext = path.extname(full).slice(1);
    const mimeMap = { mp3: 'audio/mpeg', json: 'application/json', jpg: 'image/jpeg', png: 'image/png' };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');

    // Range 支持（音频 seek）
    const stat = fs.statSync(full);
    const range = req.headers.range;
    if (range) {
      const [s, e] = range.replace('bytes=', '').split('-');
      const start = parseInt(s);
      const end = e ? parseInt(e) : stat.size - 1;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      res.status(206);
      return fs.createReadStream(full, { start, end }).pipe(res);
    }

    res.setHeader('Content-Length', String(stat.size));
    fs.createReadStream(full).pipe(res);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

// ─── 初始化：把现有 db.json 和 uploads/music/ 导入本地存储 ──────────────────

function initLocalData() {
  const owner = process.env.GITHUB_OWNER || 'Jason-purse';
  const dbRepo = process.env.GITHUB_DB_REPO || 'music-hub-db';
  const filesRepo = process.env.STORAGE_GITHUB_REPO || 'music-hub-files';
  const branch = 'main';

  // db.json
  const dbDir = repoDir(owner, dbRepo, branch);
  const dbJson = path.join(dbDir, 'db.json');
  if (!fs.existsSync(dbJson)) {
    fs.mkdirSync(dbDir, { recursive: true });
    // 从 /tmp/db.json 或上级目录的现有数据初始化
    const candidates = ['/tmp/db.json', path.join(__dirname, '..', 'data', 'db.json')];
    const src = candidates.find(f => fs.existsSync(f));
    if (src) {
      fs.copyFileSync(src, dbJson);
      console.log(`  📋 db.json 初始化自 ${src}`);
    } else {
      // 空数据库
      fs.writeFileSync(dbJson, JSON.stringify({ songs: [], playlists: [], version: 1, updatedAt: new Date().toISOString() }, null, 2));
      console.log('  📋 db.json 初始化为空数据库');
    }
  }

  // audio/ 目录 → 软链接到 uploads/music/
  const audioDir = path.join(repoDir(owner, filesRepo, branch), 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(path.join(repoDir(owner, filesRepo, branch)), { recursive: true });
    // 创建软链接，让 audio/ 目录直接指向 uploads/music/
    if (fs.existsSync(UPLOADS_DIR)) {
      fs.symlinkSync(UPLOADS_DIR, audioDir);
      console.log(`  🎵 audio/ 目录软链接到 ${UPLOADS_DIR} (${fs.readdirSync(UPLOADS_DIR).filter(f=>f.endsWith('.mp3')).length} 个 MP3)`);
    } else {
      fs.mkdirSync(audioDir, { recursive: true });
      console.log('  ⚠️  uploads/music/ 不存在，audio/ 为空目录');
    }
  }
}

// ─── 启动 ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('\n🎭 MusicHub Local GitHub API Mock 已启动');
  console.log(`   → http://localhost:${PORT}`);
  console.log(`   → Contents API: http://localhost:${PORT}/repos/{owner}/{repo}/contents/{path}`);
  console.log(`   → Raw files:    http://localhost:${PORT}/raw/{owner}/{repo}/{branch}/{path}\n`);
  initLocalData();
  console.log('\n✅ 准备就绪，Next.js 可以连接了\n');
});
