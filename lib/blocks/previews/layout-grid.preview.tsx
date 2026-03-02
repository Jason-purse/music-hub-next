'use client'

export function LayoutGridPreview({ props }: { props: any }) {
  const cols = Number(props.cols) || 2
  return (
    <div className="p-3 border border-dashed border-green-300 bg-green-50/30 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-green-600">⊞ 网格容器</span>
        <span className="text-[10px] text-green-500 bg-green-100 px-1.5 py-0.5 rounded">容器</span>
        <span className="text-[10px] text-green-500">{cols}列</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols * 2 }).map((_, i) => (
          <div key={i} className="h-6 bg-green-100 rounded border border-green-200" />
        ))}
      </div>
    </div>
  )
}
