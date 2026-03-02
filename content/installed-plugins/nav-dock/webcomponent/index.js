// nav-dock Web Components
// Defines: nav-dock-main, nav-dock-mini, nav-breadcrumb-wc

/* ============================================================
   CE 1: nav-dock-main — 全站悬浮导航坞
   ============================================================ */
class NavDockMain extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._position = 'bottom';
    this._collapsed = false;
    this._lastScrollY = 0;
    this._scrollHidden = false;
    this._popoverOpen = false;
    this._scrollTimer = null;
    this._boundOnScroll = this._onScroll.bind(this);
    this._boundOnPopstate = this._onPopstate.bind(this);
    this._boundOnMouseMove = this._onMouseMove.bind(this);
    this._boundOnMouseLeave = this._onMouseLeave.bind(this);
    this._boundOnResize = this._onResize.bind(this);
  }

  connectedCallback() {
    const saved = localStorage.getItem('nav-dock-position');
    if (saved && ['bottom', 'left', 'right', 'top'].includes(saved)) {
      this._position = saved;
    }
    this._render();
    window.addEventListener('scroll', this._boundOnScroll, { passive: true });
    window.addEventListener('popstate', this._boundOnPopstate);
    window.addEventListener('resize', this._boundOnResize);
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._boundOnScroll);
    window.removeEventListener('popstate', this._boundOnPopstate);
    window.removeEventListener('resize', this._boundOnResize);
  }

  _isDark() {
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  _navItems() {
    return [
      { emoji: '🏠', label: '首页', href: '/' },
      { emoji: '🔍', label: '搜索', href: '/search' },
      { emoji: '🏆', label: '排行榜', href: '/rankings' },
      { emoji: '📋', label: '歌单', href: '/playlists' },
    ];
  }

  _isActive(href) {
    const p = window.location.pathname;
    if (href === '/') return p === '/';
    return p.startsWith(href);
  }

  _getSavedPosition() {
    const saved = localStorage.getItem('nav-dock-position');
    return saved && ['bottom', 'left', 'right', 'top'].includes(saved) ? saved : 'bottom';
  }

  _applyPosition() {
    const pos = this._position;
    const dock = this.shadowRoot && this.shadowRoot.querySelector('.dock');
    if (dock) {
      dock.setAttribute('data-pos', pos);
      // 根据吸附边设置 flex-direction
      dock.style.flexDirection = (pos === 'left' || pos === 'right') ? 'column' : 'row';
    }
    // CSS variables for page spacing
    const html = document.documentElement;
    html.setAttribute('data-dock-position', pos);
    html.style.setProperty('--dock-bottom-space', pos === 'bottom' ? '72px' : '0px');
    html.style.setProperty('--dock-left-space', pos === 'left' ? '72px' : '0px');
    html.style.setProperty('--dock-right-space', pos === 'right' ? '72px' : '0px');
    html.style.setProperty('--dock-top-space', pos === 'top' ? '72px' : '0px');
    localStorage.setItem('nav-dock-position', pos);
    document.cookie = 'nav-dock-position=' + pos + '; path=/; max-age=31536000';
  }

  _setPosition(pos) {
    this._position = pos;
    this._popoverOpen = false;
    this._applyPosition();
    this._render();
    // _applyPosition is called inside _render() now
  }

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
    if (this._collapsed) {
      const html = document.documentElement;
      html.style.setProperty('--dock-bottom-space', '0px');
      html.style.setProperty('--dock-left-space', '0px');
      html.style.setProperty('--dock-right-space', '0px');
      html.style.setProperty('--dock-top-space', '0px');
    } else {
      this._applyPosition();
    }
    this._render();
    // _applyPosition is called inside _render() now
  }

  _togglePopover() {
    this._popoverOpen = !this._popoverOpen;
    this._render();
    // _applyPosition is called inside _render() now
  }

  _onScroll() {
    clearTimeout(this._scrollTimer);
    this._scrollTimer = setTimeout(() => {
      const currentY = window.scrollY;
      const dock = this.shadowRoot.querySelector('.dock');
      if (!dock) return;
      if (currentY > this._lastScrollY && currentY > 50) {
        this._scrollHidden = true;
      } else {
        this._scrollHidden = false;
      }
      this._lastScrollY = currentY;
      this._updateScrollVisibility();
    }, 150);
  }

  _updateScrollVisibility() {
    const dock = this.shadowRoot.querySelector('.dock');
    if (!dock || this._collapsed) return;
    if (this._scrollHidden) {
      dock.classList.add('scroll-hidden');
    } else {
      dock.classList.remove('scroll-hidden');
    }
  }

  _initDrag() {
    const dock = this.shadowRoot.querySelector('.dock');
    if (!dock || dock._dragInited) return;
    dock._dragInited = true;

    let dragging = false, startX, startY, startRect;

    dock.addEventListener('pointerdown', e => {
      if (e.target.closest('button,a,[data-no-drag]')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startRect = dock.getBoundingClientRect();
      dock.setPointerCapture(e.pointerId);
      dock.style.transition = 'none';
      // 拖拽开始：把 dock 从 CSS 定位改成 absolute+inline style 跟随鼠标
      dock.style.left = startRect.left + 'px';
      dock.style.top = startRect.top + 'px';
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.transform = 'none';
      e.preventDefault();
    });

    dock.addEventListener('pointermove', e => {
      if (!dragging) return;
      dock.style.left = (startRect.left + e.clientX - startX) + 'px';
      dock.style.top = (startRect.top + e.clientY - startY) + 'px';
    });

    dock.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      dock.style.transition = '';
      this._snapToEdge(dock);
    });
  }

  _snapToEdge(dock) {
    const rect = dock.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dists = {
      bottom: vh - cy,
      top: cy,
      left: cx,
      right: vw - cx,
    };
    const nearest = Object.entries(dists).sort((a,b) => a[1]-b[1])[0][0];

    // 清除 inline style，改回 data-pos 控制
    dock.style.left = '';
    dock.style.top = '';
    dock.style.right = '';
    dock.style.bottom = '';
    dock.style.transform = '';

    this._setPosition(nearest); // 保存并重新渲染
  }


  _onPopstate() {
    this._render();
    // _applyPosition is called inside _render() now
  }

  _onResize() {
    this._resetScales();
  }

  _onMouseMove(e) {
    if (window.innerWidth < 768) return;
    const dock = this.shadowRoot.querySelector('.dock');
    if (!dock) return;
    const items = dock.querySelectorAll('.nav-item');
    const isHorizontal = this._position === 'bottom' || this._position === 'top';
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = isHorizontal
        ? rect.left + rect.width / 2
        : rect.top + rect.height / 2;
      const mousePos = isHorizontal ? e.clientX : e.clientY;
      const distance = Math.abs(mousePos - center);
      const sigma = 60;
      const scale = 1.0 + 0.6 * Math.exp(-(distance * distance) / (2 * sigma * sigma));
      item.style.transform = 'scale(' + scale + ')';
    });
  }

  _onMouseLeave() {
    this._resetScales();
  }

  _resetScales() {
    const dock = this.shadowRoot.querySelector('.dock');
    if (!dock) return;
    const items = dock.querySelectorAll('.nav-item');
    items.forEach((item) => {
      item.style.transform = 'scale(1)';
    });
  }

  _scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  _render() {
    const dark = this._isDark();
    const pos = this._position;
    const isHorizontal = pos === 'bottom' || pos === 'top';

    const bgColor = dark ? 'rgba(30,30,30,0.88)' : 'rgba(255,255,255,0.85)';
    const borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const shadowColor = dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)';
    const textColor = dark ? '#e0e0e0' : '#333';
    const activeColor = '#3b82f6';
    const hoverBg = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
    const popBg = dark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)';

    var borderRadius;
    switch (pos) {
      case 'bottom': borderRadius = '16px 16px 0 0'; break;
      case 'top': borderRadius = '0 0 16px 16px'; break;
      case 'left': borderRadius = '0 16px 16px 0'; break;
      case 'right': borderRadius = '16px 0 0 16px'; break;
    }

    
    var togglePositionCSS; if (this._collapsed) {
      switch (pos) {
        case 'bottom': togglePositionCSS = 'bottom:8px;right:16px;'; break;
        case 'top': togglePositionCSS = 'top:8px;right:16px;'; break;
        case 'left': togglePositionCSS = 'left:8px;top:16px;'; break;
        case 'right': togglePositionCSS = 'right:8px;top:16px;'; break;
      }
    } else {
      switch (pos) {
        case 'bottom': togglePositionCSS = 'bottom:70px;right:16px;'; break;
        case 'top': togglePositionCSS = 'top:70px;right:16px;'; break;
        case 'left': togglePositionCSS = 'left:70px;top:16px;'; break;
        case 'right': togglePositionCSS = 'right:70px;top:16px;'; break;
      }
    }

    var dockSize = isHorizontal
      ? 'height:64px;max-width:420px;width:90vw;'
      : 'width:64px;max-height:420px;height:90vh;';

    var flexDir = isHorizontal ? 'row' : 'column';

    var popoverPos;
    switch (pos) {
      case 'bottom': popoverPos = 'bottom:48px;'; break;
      case 'top': popoverPos = 'top:48px;'; break;
      case 'left': popoverPos = 'left:48px;'; break;
      case 'right': popoverPos = 'right:48px;'; break;
    }

    this.shadowRoot.innerHTML = '';

    var style = document.createElement('style');
    style.textContent = [
      ':host { display:block; position:relative; z-index:9999; }',
      /* 基础位置 - 由 data-pos attribute 控制 */
      '.dock {',
      '  position:fixed;',
      '  z-index:99999;',
      '  display:' + (this._collapsed ? 'none' : 'flex') + ';',
      '  align-items:center;',
      '  justify-content:center;',
      '  gap:4px;',
      '  padding:0 12px;',
      '  background:' + bgColor + ';',
      '  backdrop-filter:blur(14px);',
      '  -webkit-backdrop-filter:blur(14px);',
      '  border:1px solid ' + borderColor + ';',
      '  border-radius:' + borderRadius + ';',
      '  box-shadow:0 8px 32px ' + shadowColor + ';',
      '  transition:transform 0.25s ease, opacity 0.25s ease;',
      '  box-sizing:border-box;',
      '}',
      /* 位置吸附 - 通过 data-pos attribute */
      '.dock[data-pos="bottom"] { bottom:16px; left:50%; transform:translateX(-50%); }',
      '.dock[data-pos="top"] { top:16px; left:50%; transform:translateX(-50%); }',
      '.dock[data-pos="left"] { left:16px; top:50%; transform:translateY(-50%); }',
      '.dock[data-pos="right"] { right:16px; top:50%; transform:translateY(-50%); }',
      /* scroll 隐藏动画 - 叠加在基础 transform 上 */
      '.dock[data-pos="bottom"].scroll-hidden { transform:translateX(-50%) translateY(110%); opacity:0; }',
      '.dock[data-pos="top"].scroll-hidden { transform:translateX(-50%) translateY(-110%); opacity:0; }',
      '.dock[data-pos="left"].scroll-hidden { transform:translateY(-50%) translateX(-110%); opacity:0; }',
      '.dock[data-pos="right"].scroll-hidden { transform:translateY(-50%) translateX(110%); opacity:0; }',
      '.nav-item {',
      '  display:flex;',
      '  flex-direction:column;',
      '  align-items:center;',
      '  justify-content:center;',
      '  text-decoration:none;',
      '  padding:6px 10px;',
      '  border-radius:12px;',
      '  cursor:pointer;',
      '  transition:transform 0.15s ease, background 0.15s ease;',
      '  color:' + textColor + ';',
      '  user-select:none;',
      '  -webkit-user-select:none;',
      '  background:transparent;',
      '  border:none;',
      '  font-family:inherit;',
      '}',
      '.nav-item:hover { background:' + hoverBg + '; }',
      '.nav-item.active { color:' + activeColor + '; }',
      '.nav-item .icon { font-size:28px; line-height:1; pointer-events:none; }',
      '.nav-item .label { font-size:10px; margin-top:2px; white-space:nowrap; pointer-events:none; }',
      '.toggle-btn {',
      '  position:fixed;',
      '  ' + togglePositionCSS,
      '  width:36px;',
      '  height:36px;',
      '  display:flex;',
      '  align-items:center;',
      '  justify-content:center;',
      '  background:' + (dark ? 'rgba(50,50,50,0.7)' : 'rgba(200,200,200,0.6)') + ';',
      '  backdrop-filter:blur(8px);',
      '  -webkit-backdrop-filter:blur(8px);',
      '  border:none;',
      '  border-radius:50%;',
      '  font-size:18px;',
      '  cursor:pointer;',
      '  z-index:100000;',
      '  transition:opacity 0.2s;',
      '  opacity:0.6;',
      '  line-height:1;',
      '}',
      '.toggle-btn:hover { opacity:1; }',
      '.settings-btn {',
      '  display:flex;',
      '  align-items:center;',
      '  justify-content:center;',
      '  padding:6px;',
      '  border-radius:12px;',
      '  cursor:pointer;',
      '  background:transparent;',
      '  border:none;',
      '  font-size:18px;',
      '  position:relative;',
      '  color:' + textColor + ';',
      '  transition:background 0.15s;',
      '}',
      '.settings-btn:hover { background:' + hoverBg + '; }',
      '.popover {',
      '  position:absolute;',
      '  ' + popoverPos,
      '  background:' + popBg + ';',
      '  backdrop-filter:blur(12px);',
      '  -webkit-backdrop-filter:blur(12px);',
      '  border:1px solid ' + borderColor + ';',
      '  border-radius:12px;',
      '  padding:8px;',
      '  display:grid;',
      '  grid-template-columns:1fr 1fr;',
      '  gap:4px;',
      '  box-shadow:0 4px 20px ' + shadowColor + ';',
      '  z-index:100001;',
      '}',
      '.popover button {',
      '  padding:8px 12px;',
      '  border:none;',
      '  border-radius:8px;',
      '  background:' + (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') + ';',
      '  cursor:pointer;',
      '  font-size:14px;',
      '  color:' + textColor + ';',
      '  transition:background 0.15s;',
      '  white-space:nowrap;',
      '}',
      '.popover button:hover { background:' + (dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)') + '; }',
      '.popover button.sel { background:' + activeColor + '; color:#fff; }',
    ].join('\n');
    this.shadowRoot.appendChild(style);

    // Toggle button
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn';
    toggleBtn.textContent = '⚓';
    toggleBtn.setAttribute('aria-label', this._collapsed ? '展开导航' : '收起导航');
    toggleBtn.addEventListener('click', () => this._toggleCollapse());
    this.shadowRoot.appendChild(toggleBtn);

    // Dock container
    var dock = document.createElement('div');
    dock.className = 'dock';

    // Nav items
    var items = this._navItems();
    var self = this;
    items.forEach(function(item) {
      var a = document.createElement('a');
      a.className = 'nav-item' + (self._isActive(item.href) ? ' active' : '');
      a.href = item.href;
      var icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = item.emoji;
      var label = document.createElement('span');
      label.className = 'label';
      label.textContent = item.label;
      a.appendChild(icon);
      a.appendChild(label);
      dock.appendChild(a);
    });

    // Now playing button
    var playBtn = document.createElement('button');
    playBtn.className = 'nav-item';
    var playIcon = document.createElement('span');
    playIcon.className = 'icon';
    playIcon.textContent = '🎵';
    var playLabel = document.createElement('span');
    playLabel.className = 'label';
    playLabel.textContent = '正在播放';
    playBtn.appendChild(playIcon);
    playBtn.appendChild(playLabel);
    playBtn.addEventListener('click', () => this._scrollToBottom());
    dock.appendChild(playBtn);

    // Settings button
    var settingsWrap = document.createElement('div');
    settingsWrap.style.position = 'relative';
    settingsWrap.style.display = 'flex';
    settingsWrap.style.alignItems = 'center';
    var settingsBtn = document.createElement('button');
    settingsBtn.className = 'settings-btn';
    settingsBtn.textContent = '⚙';
    settingsBtn.setAttribute('aria-label', '切换位置');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePopover();
    });
    settingsWrap.appendChild(settingsBtn);

    if (this._popoverOpen) {
      var popover = document.createElement('div');
      popover.className = 'popover';
      var directions = [
        { label: '↑ 顶部', value: 'top' },
        { label: '↓ 底部', value: 'bottom' },
        { label: '← 左侧', value: 'left' },
        { label: '→ 右侧', value: 'right' },
      ];
      directions.forEach((d) => {
        var btn = document.createElement('button');
        btn.textContent = d.label;
        if (this._position === d.value) btn.className = 'sel';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._setPosition(d.value);
        });
        popover.appendChild(btn);
      });
      settingsWrap.appendChild(popover);

      // Close popover on outside click
      var closePopover = (e) => {
        if (!settingsWrap.contains(e.target)) {
          this._popoverOpen = false;
          this._render();
    // _applyPosition is called inside _render() now
          document.removeEventListener('click', closePopover);
        }
      };
      setTimeout(() => document.addEventListener('click', closePopover), 0);
    }

    dock.appendChild(settingsWrap);

    // Mouse magnification events
    dock.addEventListener('mousemove', this._boundOnMouseMove);
    dock.addEventListener('mouseleave', this._boundOnMouseLeave);

    this.shadowRoot.appendChild(dock);

    // 初始化拖拽（只在首次渲染时）
    this._initDrag();
    // 应用位置（设置 data-pos attribute）
    this._applyPosition();
  }
}

/* =+
   CE 2: nav-dock-mini — 迷你积木，嵌入内容区
   ============================================================ */
class NavDockMini extends HTMLElement {
  static get observedAttributes() {
    return ['size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._boundOnPopstate = () => this._render();
    // _applyPosition is called inside _render() now
  }

  connectedCallback() {
    this._render();
    // _applyPosition is called inside _render() now
    window.addEventListener('popstate', this._boundOnPopstate);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._boundOnPopstate);
  }

  attributeChangedCallback() {
    this._render();
    // _applyPosition is called inside _render() now
  }

  _navItems() {
    return [
      { emoji: '🏠', label: '首页', href: '/' },
      { emoji: '🔍', label: '搜索', href: '/search' },
      { emoji: '🏆', label: '排行榜', href: '/rankings' },
      { emoji: '📋', label: '歌单', href: '/playlists' },
    ];
  }

  _isActive(href) {
    var p = window.location.pathname;
    if (href === '/') return p === '/';
    return p.startsWith(href);
  }

  _render() {
    var size = this.getAttribute('size') || 'md';
    var dark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    var sizes = {
      sm: { fontSize: '12px', padding: '4px 8px', iconSize: '14px', gap: '2px' },
      md: { fontSize: '13px', padding: '6px 12px', iconSize: '16px', gap: '4px' },
      lg: { fontSize: '15px', padding: '8px 16px', iconSize: '20px', gap: '6px' },
    };
    var s = sizes[size] || sizes.md;

    var textColor = dark ? '#ccc' : '#555';
    var activeColor = '#3b82f6';
    var hoverBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    var activeBg = dark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)';

    this.shadowRoot.innerHTML = '';

    var style = document.createElement('style');
    style.textContent = [
      ':host { display:inline-flex; }',
      '.container {',
      '  display:inline-flex;',
      '  align-items:center;',
      '  gap:' + s.gap + ';',
      '  border-radius:999px;',
      '}',
      'a {',
      '  display:inline-flex;',
      '  align-items:center;',
      '  gap:4px;',
      '  padding:' + s.padding + ';',
      '  border-radius:999px;',
      '  text-decoration:none;',
      '  font-size:' + s.fontSize + ';',
      '  color:' + textColor + ';',
      '  transition:background 0.15s, color 0.15s;',
      '  white-space:nowrap;',
      '}',
      'a:hover { background:' + hoverBg + '; }',
      'a.active { color:' + activeColor + '; background:' + activeBg + '; font-weight:600; }',
      '.icon { font-size:' + s.iconSize + '; line-height:1; }',
    ].join('\n');
    this.shadowRoot.appendChild(style);

    var container = document.createElement('div');
    container.className = 'container';

    var self = this;
    this._navItems().forEach(function(item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.className = self._isActive(item.href) ? 'active' : '';
      var icon = document.createElement('span');
      icon.className = 'icon';
      icon.textContent = item.emoji;
      var label = document.createElement('span');
      label.textContent = item.label;
      a.appendChild(icon);
      a.appendChild(label);
      container.appendChild(a);
    });

    this.shadowRoot.appendChild(container);
  }
}

/* ============================================================
   CE 3: nav-breadcrumb-wc — 面包屑积木
   ============================================================ */
class NavBreadcrumbWc extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._boundOnPopstate = () => this._render();
    // _applyPosition is called inside _render() now
  }

  connectedCallback() {
    this._render();
    // _applyPosition is called inside _render() now
    window.addEventListener('popstate', this._boundOnPopstate);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._boundOnPopstate);
  }

  _routeMap() {
    return {
      '/': '首页',
      '/search': '搜索',
      '/rankings': '排行榜',
      '/playlists': '歌单',
    };
  }

  _parsePath() {
    var pathname = window.location.pathname;
    var crumbs = [];

    if (pathname === '/') {
      crumbs.push({ label: '首页', href: null });
      return crumbs;
    }

    // Always start with 首页
    crumbs.push({ label: '首页', href: '/' });

    var map = this._routeMap();
    if (map[pathname]) {
      crumbs.push({ label: map[pathname], href: null });
    } else {
      // Check for /song/[id]
      var songMatch = pathname.match(/^\/song\/(.+)$/);
      if (songMatch) {
        crumbs.push({ label: '歌曲详情', href: null });
      } else {
        // Fallback: show pathname segments
        var segments = pathname.split('/').filter(Boolean);
        var accumulated = '';
        segments.forEach(function(seg, i) {
          accumulated += '/' + seg;
          var isLast = i === segments.length - 1;
          crumbs.push({
            label: map[accumulated] || decodeURIComponent(seg),
            href: isLast ? null : accumulated,
          });
        });
      }
    }

    return crumbs;
  }

  _render() {
    var dark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    var textColor = dark ? '#999' : '#888';
    var linkColor = dark ? '#aaa' : '#666';
    var boldColor = dark ? '#ddd' : '#333';

    this.shadowRoot.innerHTML = '';

    var style = document.createElement('style');
    style.textContent = [
      ':host { display:block; }',
      '.breadcrumb {',
      '  display:flex;',
      '  align-items:center;',
      '  gap:6px;',
      '  font-size:12px;',
      '  color:' + textColor + ';',
      '  flex-wrap:wrap;',
      '}',
      'a {',
      '  color:' + linkColor + ';',
      '  text-decoration:none;',
      '  transition:color 0.15s;',
      '}',
      'a:hover { color:' + (dark ? '#fff' : '#000') + '; text-decoration:underline; }',
      '.sep { color:' + textColor + '; opacity:0.5; user-select:none; }',
      '.current { font-weight:700; color:' + boldColor + '; }',
    ].join('\n');
    this.shadowRoot.appendChild(style);

    var nav = document.createElement('nav');
    nav.className = 'breadcrumb';
    nav.setAttribute('aria-label', '面包屑导航');

    var crumbs = this._parsePath();
    crumbs.forEach(function(crumb, i) {
      if (i > 0) {
        var sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '/';
        sep.setAttribute('aria-hidden', 'true');
        nav.appendChild(sep);
      }

      if (crumb.href) {
        var a = document.createElement('a');
        a.href = crumb.href;
        a.textContent = crumb.label;
        nav.appendChild(a);
      } else {
        var span = document.createElement('span');
        span.className = 'current';
        span.textContent = crumb.label;
        span.setAttribute('aria-current', 'page');
        nav.appendChild(span);
      }
    });

    this.shadowRoot.appendChild(nav);
  }
}

/* ============================================================
   Register Custom Elements
   ============================================================ */
customElements.define('nav-dock-main', NavDockMain);
customElements.define('nav-dock-mini', NavDockMini);
customElements.define('nav-breadcrumb-wc', NavBreadcrumbWc);
