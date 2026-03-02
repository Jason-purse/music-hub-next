'use client'

export function LayoutSectionPreview({ props }: { props: any }) {
  const bg = props.background && props.background !== 'transparent' ? props.background : '#f3f4f6'
  return (
    <div className="p-3 border border-dashed border-gray-400 bg-gray-50/30 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-gray-600">⬛ 区块</span>
        <span className="text-[10px] text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">容器</span>
        <div className="w-3 h-3 rounded border border-gray-300" style={{ background: bg }} />
      </div>
      <div className="h-8 rounded" style={{ background: bg, opacity: 0.5 }} />
    </div>
  )
}
