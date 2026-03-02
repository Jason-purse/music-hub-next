'use client'

export function LayoutStackPreview({ props }: { props: any }) {
  return (
    <div className="p-3 border border-dashed border-purple-300 bg-purple-50/30 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-purple-600">🔲 层叠</span>
        <span className="text-[10px] text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">容器</span>
      </div>
      <div className="relative h-12">
        <div className="absolute inset-0 bg-purple-100 rounded border border-purple-200" />
        <div className="absolute inset-2 bg-purple-200 rounded border border-purple-300 flex items-center justify-center">
          <span className="text-[10px] text-purple-500">前景</span>
        </div>
      </div>
    </div>
  )
}
