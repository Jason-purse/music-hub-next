'use client'

export function LayoutBoxPreview({ props }: { props: any }) {
  const dir = props.direction || 'row'
  return (
    <div className="p-3 border border-dashed border-blue-300 bg-blue-50/30 rounded-lg">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-blue-500">⬜ Flex 容器</span>
        <span className="text-[10px] text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded">容器</span>
        <span className="text-[10px] text-blue-400">{dir === 'row' ? '→ 水平' : '↓ 垂直'}</span>
      </div>
      <div className={`flex ${dir === 'row' ? 'flex-row' : 'flex-col'} gap-1.5`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-6 bg-blue-100 rounded border border-blue-200" />
        ))}
      </div>
    </div>
  )
}
