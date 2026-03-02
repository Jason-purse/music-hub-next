// hello-plugin WC — 示例插件，验证 Slot 注入 + admin 页 + SDK 数据 API

// ── 前台 banner ────────────────────────────────────────────────────────────────
class HelloBanner extends HTMLElement {
  async connectedCallback() {
    // 先用默认值渲染
    this._render('🎉 Hello Plugin 已激活！', '#6366f1')

    // 然后尝试从 SDK 读取配置数据
    const sdk = window.__MusicHub__
    if (sdk) {
      try {
        const data = await sdk.getData()
        const title = data.displayTitle || '🎉 Hello Plugin 已激活！'
        const color = data.accentColor || '#6366f1'
        this._render(title, color)
      } catch (e) {
        // 保持默认渲染
      }
    }
  }

  _render(message, accentColor) {
    this.innerHTML = `
      <div style="
        text-align:center;
        padding:8px 16px;
        background:linear-gradient(90deg,${accentColor},${this._lighten(accentColor)});
        color:#fff;
        font-size:13px;
        letter-spacing:.5px;
      ">${this._escapeHtml(message)}</div>
    `
  }

  _escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  _lighten(hex) {
    // Simple hex color lighten
    try {
      const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40)
      const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40)
      const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    } catch {
      return '#8b5cf6'
    }
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
          ✅ SDK 注入（window.__MusicHub__）<br/>
          ✅ configSchema 声明式配置
        </div>
        <div id="hello-admin-data" style="background:#f9fafb;border-radius:8px;padding:12px;font-size:13px;margin-top:12px;color:#666">
          加载配置数据...
        </div>
      </div>
    `

    const dataEl = this.querySelector('#hello-admin-data')
    const sdk = window.__MusicHub__
    if (!sdk) {
      dataEl.innerHTML = '❌ SDK 未注入'
      return
    }

    sdk.getData().then(data => {
      if (Object.keys(data).length > 0) {
        dataEl.innerHTML = `
          <b>💾 当前配置数据</b><br/>
          ${Object.entries(data).map(([k, v]) => `<code>${k}</code> = ${v}`).join('<br/>')}
        `
      } else {
        dataEl.innerHTML = '<b>💾 配置数据</b><br/><em>暂无配置，请前往插件管理页设置</em>'
      }
    }).catch(err => {
      dataEl.innerHTML = `❌ 加载失败: ${err.message}`
    })
  }
}

customElements.define('hello-banner', HelloBanner)
customElements.define('hello-admin', HelloAdmin)

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
