# MusicHub 外观适配约定

## 颜色系统
使用 CSS 变量而非硬编码颜色：
- `var(--music-bg)` 主背景
- `var(--music-surface)` 卡片/面板背景
- `var(--music-text)` 主文字
- `var(--music-text-muted)` 次要文字
- `var(--music-border)` 边框
- `var(--music-accent)` 强调色

## React 组件（Tailwind）
使用 `dark:` 变体类，跟随 `<html class="dark">`。

## WC 插件
使用 CSS 变量，监听 `colorscheme:change` 事件响应动态切换：
```js
window.addEventListener('colorscheme:change', (e) => {
  const { scheme, resolved } = e.detail // 'dark' | 'light'
})
```

## 三态
- `light` 浅色（明确指定）
- `dark` 深色（明确指定）
- `system` 跟随系统（默认）

## 持久化
- `localStorage: 'music-color-scheme'`
- `cookie: 'music-color-scheme'`（SSR 使用，与 localStorage 同步）

## 未来扩展
新增外观模式只需：
1. 定义新的 CSS 变量值集合
2. 在 globals.css 加对应 class
3. ColorScheme 类型扩展
