'use client'

export function LayoutColumnsPreview({ props }: { props: any }) {
  const ratio = props.ratio || '1:1'
  const parts = ratio.split(':').map(Number)
  const total = parts.reduce((a: number, b: number) => a + b, 0)
  return (
    <div className="p-3 border border-dashed border-amber-300 bg-amber-50/30 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-amber-600">▥ 多列</span>
        <span className="text-[10px] text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded">容器</span>
        <span className="text-[10px] text-amber-500">{ratio}</span>
      </div>
      <div className="flex gap-1.5">
        {parts.map((p: number, i: number) => (
          <div key={i} className="h-8 bg-amber-100 rounded border border-amber-200"
            style={{ flex: p / total }} />
        ))}
      </div>
    </div>
  )
}
