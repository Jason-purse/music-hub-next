/**
 * 内置 Block 类型 → 中文显示名
 * 纯数据，无 React 依赖，Server/Client 均可安全引入。
 *
 * Timeline TOC、编辑器画布 Block 标题、搜索等场景共用。
 * 社区插件自行注册时应同样提供 label，此处作为内置插件的兜底。
 */
export const BLOCK_LABELS: Record<string, string> = {
  'hero-banner':   '横幅广告',
  'chart-list':    '榜单卡',
  'decade-stack':  '年代精选',
  'playlist-grid': '歌单网格',
  'search-bar':    '搜索框',
  'stats-card':    '统计卡片',
  'spacer':        '间距填充',
}

/**
 * 从 Block 提取人类可读标题（Timeline TOC、画布标识等）
 * 优先级：
 *  1. block.label          — 用户在编辑器里手动命名
 *  2. props.title/label/heading/name/decade  — 插件字段里的标题类属性
 *  3. BLOCK_LABELS[type]   — 插件类型的中文名
 *  4. 序号兜底             — 最后防线，至少显示数字而非「节点 N」
 */
export function resolveBlockTitle(
  block: { type: string; props?: Record<string, any>; label?: string },
  index: number
): string {
  // 1. 用户自命名
  if (block.label?.trim()) return block.label.trim()

  // 2. 插件 props 中的标题类字段（顺序按常见程度排列）
  const p = block.props || {}
  const fromProps =
    p.title   ||
    p.heading ||
    p.name    ||
    p.label   ||   // 插件自己的 label prop（注意与 block.label 区分）
    p.decade   ||
    p.subtitle

  if (fromProps?.trim()) return String(fromProps).trim()

  // 3. 插件类型名
  const typeLabel = BLOCK_LABELS[block.type]
  if (typeLabel) return typeLabel

  // 4. 序号兜底（数字，不说���节点」）
  return `# ${index + 1}`
}
