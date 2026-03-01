/**
 * 响应式布局工具
 *
 * 设计原则：
 * - 编辑器里配置"桌面端目标值"，工具函数自动推导移动端/平板端值
 * - 用 CSS clamp() 在运行时连续缩放，无需 JS 判断设备类型
 * - 所有 layout 组件共用，"插件复用"体现在此
 */

/**
 * 响应式 gap（列/行间距）
 * 桌面端 = gutter，平板端 ≈ gutter×0.7，手机端 ≈ gutter×0.4（最小8px）
 *
 * @example gutter=32 → "clamp(12px, calc(12px + 2.5vw), 32px)"
 */
export function responsiveGap(gutter: number): string {
  const min = Math.max(8, Math.round(gutter * 0.4))
  return `clamp(${min}px, calc(${min}px + 2.5vw), ${gutter}px)`
}

/**
 * 响应式 padding（容器内边距）
 * 桌面端 = padding，手机端 ≈ padding×0.4（最小12px）
 *
 * @example padding=48 → "clamp(16px, calc(16px + 3vw), 48px)"
 */
export function responsivePad(padding: number): string {
  const min = Math.max(12, Math.round(padding * 0.4))
  return `clamp(${min}px, calc(${min}px + 3vw), ${padding}px)`
}

/**
 * 生成容器 padding 样式（上下响应式，左右固定为适配窄屏的1rem）
 */
export function containerStyle(padding: number): React.CSSProperties {
  const v = responsivePad(padding)
  return { paddingTop: v, paddingBottom: v, paddingLeft: '1rem', paddingRight: '1rem' }
}

// 让 TypeScript 知道 React 存在（Server Component 引用）
import type React from 'react'
