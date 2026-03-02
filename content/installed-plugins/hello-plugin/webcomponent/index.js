// hello-plugin WC — 示例插件，验证 Slot 注入 + admin 页

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
          ✅ plugin-config 传递
        </div>
      </div>
    `
  }
}

customElements.define('hello-banner', HelloBanner)
customElements.define('hello-admin', HelloAdmin)
