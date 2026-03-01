// Server Component — 可渲染 async block（chart-list 等）
import React from 'react'
import { SlotRenderer } from '../SlotRenderer'
import { LayoutProps } from './index'
import { TimelineNav } from './TimelineNav'
import { responsiveGap, containerStyle } from './utils'
import type { Block } from '../types'

// 从 block.props 提取可读标题，fallback 到序号
function blockTitle(block: Block, index: number): string {
  const p = block.props || {}
  return (
    p.title   ||
    p.label   ||
    p.heading ||
    p.name    ||
    p.decade  ||   // decade-stack 用
    `节点 ${index + 1}`
  )
}

export function Timeline({ slots, gutter = 24, padding = 32 }: LayoutProps) {
  const blocks = slots.timeline || []

  // 给 TOC 准备纯 JSON（可序列化，安全传给 Client Component）
  const tocItems = blocks.map((b, i) => ({ id: b.id, label: blockTitle(b, i) }))

  return (
    <div style={containerStyle(padding)}>
      <div className="max-w-5xl mx-auto flex gap-8 lg:gap-12 items-start">

        {/* ── 时间轴主体（Server 渲染，支持 async block）── */}
        <div className="flex-1 min-w-0 relative">
          {/* 竖线 */}
          {blocks.length > 1 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: '19px', top: '40px', bottom: '40px', width: '2px',
                background: 'linear-gradient(to bottom, #a5b4fc, #d8b4fe, #f9a8d4)',
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: responsiveGap(gutter) }}>
            {blocks.map((block, i) => (
              // id="tl-{block.id}" 供客户端 TOC scroll + IntersectionObserver 使用
              <div
                key={block.id}
                id={`tl-${block.id}`}
                className="relative flex scroll-mt-24"
                style={{ gap: `${gutter * 0.75}px` }}
              >
                {/* 节点圆圈 */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-indigo-300 shadow-sm z-10
                    flex items-center justify-center text-xs font-bold text-indigo-500">
                  {i + 1}
                </div>

                {/* 内容区 */}
                <div className="flex-1 min-w-0 pb-2">
                  <SlotRenderer blocks={[block]} gutter={gutter} />
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <p className="text-center text-gray-400 py-12">请在编辑器中向时间轴添加组件</p>
            )}
          </div>
        </div>

        {/* ── 右侧 TOC（Client Component，桌面常驻，移动 FAB）── */}
        <TimelineNav items={tocItems} />
      </div>
    </div>
  )
}
