'use client'

export function SearchBarPreview({ props }: { props: any }) {
  const tags = (props.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
  return (
    <div className="py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 border-2 border-indigo-200 rounded-2xl px-4 py-3 bg-white shadow-sm">
          <span className="text-gray-300">🔍</span>
          <span className="text-gray-400 text-sm">{props.placeholder || '搜索歌曲、歌手...'}</span>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {tags.map((t: string) => (
              <span key={t} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
