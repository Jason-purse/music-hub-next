'use client';
import { useState, useEffect } from 'react';

const TABS = ['概览', '榜单配置', '存储配置', '数据迁移', '免责声明', '页面管理'];
const PROVIDERS = ['local', 'github', 'oss', 's3'];
const PROVIDER_LABELS: Record<string, string> = { local: '本地存储', github: 'GitHub私有仓库', oss: '阿里云OSS', s3: 'AWS S3 / R2' };

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [rankings, setRankings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateLog, setMigrateLog] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || '';
    if (t) { setToken(t); loadConfig(t); loadStats(); loadRankings(t); }
  }, []);

  async function loadRankings(t: string) {
    const r = await fetch('/api/settings', { headers: { 'x-admin-token': t } });
    if (r.ok) setRankings(await r.json());
  }

  async function saveRankings() {
    const r = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(rankings) });
    const d = await r.json();
    setSaved(d.ok ? '✅ 保存成功' : '❌ 保存失败');
    setTimeout(() => setSaved(''), 3000);
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', password }) });
    const d = await r.json();
    if (d.token) { setToken(d.token); localStorage.setItem('admin_token', d.token); loadConfig(d.token); loadStats(); }
    else setLoginErr(d.error || '登录失败');
  }

  async function loadConfig(t: string) {
    const r = await fetch('/api/admin', { headers: { 'x-admin-token': t } });
    if (r.ok) setConfig(await r.json());
  }

  async function loadStats() {
    const r = await fetch('/api/songs?limit=1');
    const d = await r.json();
    setStats({ total: d.total });
  }

  async function saveConfig() {
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ action: 'update', ...config }) });
    const d = await r.json();
    setSaved(d.ok ? '✅ 保存成功' : '❌ 保存失败');
    setTimeout(() => setSaved(''), 3000);
  }

  if (!token) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={login} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">管理后台</h1>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="请输入管理员密码" className="w-full border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300" />
        {loginErr && <p className="text-red-500 text-xs">{loginErr}</p>}
        <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition">登录</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">🎶 MusicHub 管理后台</h1>
        <div className="flex gap-3 items-center">
          <a href="/" className="text-sm text-indigo-500 hover:underline">← 返回网站</a>
          <button onClick={() => { localStorage.removeItem('admin_token'); setToken(''); }} className="text-sm text-gray-400 hover:text-gray-600">退出</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-lg text-sm transition ${tab === i ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* 概览 */}
        {tab === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '全部歌曲', value: stats?.total ?? '...' },
              { label: '存储方案', value: config?.storage?.provider || '-' },
              { label: '当前版本', value: 'v1.0.0' },
              { label: '状态', value: '运行中 ✅' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">{item.value}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
            
            {/* 插件市场入口 */}
            <a href="/admin/plugins" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-pointer group">
              <div className="text-2xl font-bold text-indigo-500 group-hover:text-indigo-600">🧩</div>
              <div className="text-sm text-gray-500 mt-1 group-hover:text-gray-600">插件市场</div>
            </a>
            {/* 数据源中心入口 */}
            <a href="/admin/datasources" className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-pointer group">
              <div className="text-2xl font-bold text-indigo-500 group-hover:text-indigo-600">🗄️</div>
              <div className="text-sm text-gray-500 mt-1 group-hover:text-gray-600">数据源中心</div>
            </a>
          </div>
        )}

        {/* 榜单配置 */}
        {tab === 1 && rankings && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="font-semibold mb-1">榜单配置</h2>
              <p className="text-xs text-gray-400">调整各榜单的展示数量和开关，保存后立即生效。</p>
            </div>

            {/* 各榜单 */}
            {(['hot', 'liked', 'newest'] as const).map(key => {
              const chart = rankings.rankings[key];
              const labels: Record<string, string> = { hot: '🔥 热播榜', liked: '❤️ 最受欢迎', newest: '✨ 新上架' };
              const descs:  Record<string, string> = { hot: '按播放次数排序', liked: '按点赞数排序', newest: '按添加时间排序' };
              return (
                <div key={key} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{labels[key]}</div>
                    <div className="text-xs text-gray-400">{descs[key]}</div>
                  </div>
                  {/* 开关 */}
                  <button onClick={() => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, [key]: { ...chart, enabled: !chart.enabled } } }))}
                    className={`w-10 h-6 rounded-full transition shrink-0 ${chart.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                    <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${chart.enabled ? 'translate-x-4' : ''}`} />
                  </button>
                  {/* TOP N */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400">TOP</span>
                    <input type="number" min={5} max={100} value={chart.limit}
                      onChange={e => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, [key]: { ...chart, limit: parseInt(e.target.value) || 20 } } }))}
                      className="w-16 border rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                </div>
              );
            })}

            {/* 年代精选 */}
            <div className="py-3 border-b border-gray-50 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium">🎵 年代精选榜</div>
                  <div className="text-xs text-gray-400">80s / 90s / 00s … 各年代分别排行</div>
                </div>
                <button onClick={() => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, byDecade: { ...r.rankings.byDecade, enabled: !r.rankings.byDecade.enabled } } }))}
                  className={`w-10 h-6 rounded-full transition shrink-0 ${rankings.rankings.byDecade.enabled ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${rankings.rankings.byDecade.enabled ? 'translate-x-4' : ''}`} />
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-400">每榜TOP</span>
                  <input type="number" min={3} max={50} value={rankings.rankings.byDecade.limitPerDecade}
                    onChange={e => setRankings((r: any) => ({ ...r, rankings: { ...r.rankings, byDecade: { ...r.rankings.byDecade, limitPerDecade: parseInt(e.target.value) || 10 } } }))}
                    className="w-14 border rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveRankings} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
                保存榜单配置
              </button>
              {saved && <span className="text-sm">{saved}</span>}
            </div>
          </div>
        )}

        {/* 存储配置 */}
        {tab === 2 && config && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold">存储服务商</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PROVIDERS.map(p => (
                <button key={p} onClick={() => setConfig((c: any) => ({ ...c, storage: { ...c.storage, provider: p } }))}
                  className={`py-3 px-4 rounded-xl border-2 text-sm transition ${config.storage?.provider === p ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-medium' : 'border-gray-200 hover:border-indigo-200 text-gray-600'}`}>
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>

            {config.storage?.provider === 'github' && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-gray-700">GitHub 配置</h3>
                {['owner', 'repo', 'branch'].map(k => (
                  <div key={k} className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-20">{k}</label>
                    <input value={config.storage.github?.[k] || ''} onChange={e => setConfig((c: any) => ({ ...c, storage: { ...c.storage, github: { ...c.storage.github, [k]: e.target.value } } }))}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                ))}
              </div>
            )}

            {(config.storage?.provider === 's3') && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-gray-700">S3 / R2 配置</h3>
                {['endpoint', 'region', 'bucket', 'accessKeyId', 'secretAccessKey', 'cdnBase'].map(k => (
                  <div key={k} className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-32">{k}</label>
                    <input type={k.includes('Key') || k.includes('Secret') ? 'password' : 'text'}
                      value={config.storage.s3?.[k] || ''} onChange={e => setConfig((c: any) => ({ ...c, storage: { ...c.storage, s3: { ...c.storage.s3, [k]: e.target.value } } }))}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveConfig} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition">保存配置</button>
              {saved && <span className="text-sm">{saved}</span>}
            </div>
          </div>
        )}

        {/* 数据迁移 */}
        {tab === 3 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold">存储迁移</h2>
            <p className="text-sm text-gray-500">将音频文件从一个存储迁移到另一个存储，期间网站正常访问。</p>
            <div className="flex gap-4 flex-wrap">
              {['local→github', 'local→s3', 'github→s3', 's3→local'].map(route => (
                <button key={route} disabled={migrating} onClick={async () => {
                  const [from, to] = route.split('→');
                  setMigrating(true);
                  setMigrateLog(`开始迁移 ${from} → ${to}...\n`);
                  const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify({ action: 'migrate', from, to }) });
                  const d = await r.json();
                  setMigrateLog(prev => prev + (d.message || JSON.stringify(d)) + '\n');
                  setMigrating(false);
                }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:border-indigo-300 transition disabled:opacity-50">
                  {route}
                </button>
              ))}
            </div>
            {migrateLog && <pre className="bg-gray-50 rounded-lg p-4 text-xs font-mono whitespace-pre-wrap text-gray-600 max-h-48 overflow-auto">{migrateLog}</pre>}
          </div>
        )}

        {/* 免责声明 */}
        {tab === 4 && config && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold">免责声明配置</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">首次访问弹窗</label>
              <button onClick={() => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, showOnFirstVisit: !c.disclaimer?.showOnFirstVisit } }))}
                className={`w-12 h-6 rounded-full transition ${config.disclaimer?.showOnFirstVisit ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${config.disclaimer?.showOnFirstVisit ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-700 block mb-2">声明文案</label>
              <textarea rows={6} value={config.disclaimer?.text || ''} onChange={e => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, text: e.target.value } }))}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 w-24">投诉邮箱</label>
              <input value={config.disclaimer?.contactEmail || ''} onChange={e => setConfig((c: any) => ({ ...c, disclaimer: { ...c.disclaimer, contactEmail: e.target.value } }))}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={saveConfig} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition">保存</button>
              {saved && <span className="text-sm">{saved}</span>}
            </div>
          </div>
        )}

        {/* 页面管理 */}
        {tab === 5 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold">📄 页面管理</h2>
            <p className="text-sm text-gray-500">通过 Block 积木搭建自定义页面，发布后可通过 /pages/[slug] 访问。</p>
            <a
              href="/admin/pages"
              className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              进入页面管理 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
