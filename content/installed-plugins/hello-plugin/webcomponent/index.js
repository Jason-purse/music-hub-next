// hello-plugin WC — 示例插件，验证 Slot 注入 + admin 页 + SDK 数据 API

// ── 前台 banner ────────────────────────────────────────────────────────────────
class HelloBanner extends HTMLElement {
  connectedCallback() {
    const config = (() => {
      try { return JSON.parse(this.getAttribute('plugin-config') || '{}') } catch { return {} }
    })()
    const msg = config.message || '🎉 Hello Plugin 已激活！'
    this.innerHTML = `
      <div style="
        text-align:center;
        padding:8px 16px;
        background:linear-gradient(90deg,#6366f1,#8b5cf6);
        color:#fff;
        font-size:13px;
        letter-spacing:.5px;
      ">${msg}</div>
    `
  }
}

// ── 后台管理页 ─────────────────────────────────────────────────────────────────
class HelloAdmin extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div style="font-family:system-ui;max-width:480px">
        <h2 style="font-size:18px;font-weight:600;margin-bottom:12px">👋 Hello Plugin 管理页</h2>
        <p style="color:#666;font-size:14px;margin-bottom:16px">
          这是通过插件系统 <code>adminMenu</code> 声明自动注入的后台页面。<br/>
          插件 WC 脚本由 <code>/api/plugins/hello-plugin/script</code> 安全提供。
        </p>
        <div style="background:#f3f4f6;border-radius:8px;padding:12px;font-size:13px">
          <b>验证清单：</b><br/>
          ✅ Slot 注入（main-footer）<br/>
          ✅ Admin 菜单自动出现<br/>
          ✅ WC 脚本安全服务<br/>
          ✅ plugin-config 传递<br/>
          ✅ SDK 注入（window.__MusicHub__）
        </div>
      </div>
    `
  }
}

// ── 配置 UI WC ─────────────────────────────────────────────────────────────────
class HelloConfig extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div style="font-family:system-ui;max-width:480px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px">🔧 Hello Plugin 自定义配置</h3>
        <p style="color:#888;font-size:13px;margin-bottom:16px">
          此配置界面由插件 <code>configUI</code> 字段驱动，通过 SDK 读写数据。
        </p>
        <div id="hello-config-status" style="background:#f9fafb;border-radius:8px;padding:16px;font-size:13px;color:#666">
          加载中...
        </div>
        <div style="margin-top:16px;display:flex;gap:8px">
          <button id="hello-config-save" style="
            padding:8px 16px;background:#6366f1;color:white;border:none;
            border-radius:8px;cursor:pointer;font-size:13px;
          ">保存测试数据</button>
          <button id="hello-config-refresh" style="
            padding:8px 16px;background:#e5e7eb;color:#333;border:none;
            border-radius:8px;cursor:pointer;font-size:13px;
          ">刷新</button>
        </div>
      </div>
    `

    const statusEl = this.querySelector('#hello-config-status')
    const saveBtn = this.querySelector('#hello-config-save')
    const refreshBtn = this.querySelector('#hello-config-refresh')

    const loadData = async () => {
      const sdk = window.__MusicHub__
      if (!sdk) {
        statusEl.innerHTML = '❌ SDK 未注入'
        return
      }

      try {
        statusEl.innerHTML = '加载中...'
        const [stats, data] = await Promise.all([
          sdk.queryStats(),
          sdk.getData(),
        ])

        statusEl.innerHTML = `
          <div style="margin-bottom:12px">
            <b>📊 站点统计（queryStats）</b><br/>
            🎵 歌曲: ${stats.songs} 首<br/>
            📋 歌单: ${stats.playlists} 个<br/>
            🔥 总播放: ${stats.plays} 次
          </div>
          <div>
            <b>💾 插件数据（getData）</b><br/>
            ${Object.keys(data).length > 0
              ? Object.entries(data).map(([k, v]) => `<code>${k}</code> = ${v}`).join('<br/>')
              : '<em>暂无数据</em>'
            }
          </div>
        `
      } catch (err) {
        statusEl.innerHTML = `❌ 加载失败: ${err.message}`
      }
    }

    saveBtn.addEventListener('click', async () => {
      const sdk = window.__MusicHub__
      if (!sdk) return
      try {
        await sdk.setData('last_visit', new Date().toISOString())
        await sdk.setData('visit_count', String((parseInt(await sdk.getData().then(d => d.visit_count) || '0') + 1)))
        statusEl.innerHTML = '✅ 数据已保存，刷新查看...'
        setTimeout(loadData, 500)
      } catch (err) {
        statusEl.innerHTML = `❌ 保存失败: ${err.message}`
      }
    })

    refreshBtn.addEventListener('click', loadData)

    // 初始加载
    loadData()
  }
}

customElements.define('hello-banner', HelloBanner)
customElements.define('hello-admin', HelloAdmin)
customElements.define('hello-config', HelloConfig)

// ── 积木：站点统计卡 ────────────────────────────────────────────────────────────
class HelloStatsCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div style="
        font-family:system-ui;
        border-radius:12px;
        padding:20px;
        background:linear-gradient(135deg,#f5f3ff,#ede9fe);
        border:1px solid #e9d5ff;
      ">
        <div style="font-size:15px;font-weight:600;color:#6d28d9;margin-bottom:12px">📊 站点统计</div>
        <div id="hello-stats-content" style="font-size:13px;color:#666">加载中...</div>
      </div>
    `

    const contentEl = this.querySelector('#hello-stats-content')
    const sdk = window.__MusicHub__
    if (!sdk) {
      contentEl.innerHTML = '❌ SDK 未注入'
      return
    }

    sdk.queryStats().then(stats => {
      contentEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
          <div>
            <div style="font-size:24px;font-weight:700;color:#7c3aed">${stats.songs ?? 0}</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:2px">歌曲</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:#7c3aed">${stats.playlists ?? 0}</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:2px">歌单</div>
          </div>
          <div>
            <div style="font-size:24px;font-weight:700;color:#7c3aed">${stats.plays ?? 0}</div>
            <div style="font-size:11px;color:#a78bfa;margin-top:2px">播放</div>
          </div>
        </div>
      `
    }).catch(err => {
      contentEl.innerHTML = `❌ ${err.message}`
    })
  }
}

customElements.define('hello-stats-card', HelloStatsCard)
