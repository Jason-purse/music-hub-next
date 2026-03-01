'use client'

const DECADE_LABELS: Record<string, string> = {
  '80s': '80年代', '90s': '90年代', '00s': '00年代', '10s': '10年代', '20s': '20年代'
}
const DECADE_COLORS: Record<string, string> = {
  '80s': '#f59e0b', '90s': '#6366f1', '00s': '#10b981', '10s': '#ec4899', '20s': '#f97316'
}

export function DecadeStackPreview({ props }: { props: any }) {
  const decades: string[] = Array.isArray(props.decades) ? props.decades : ['80s', '90s']
  const cardHeight = props.cardHeight || 120

  return (
    <div className="p-4 space-y-3">
      {props.title && <h2 className="font-bold text-lg text-gray-800">{props.title}</h2>}
      <div className="relative" style={{ height: `${decades.length * cardHeight * 0.4 + cardHeight}px` }}>
        {decades.map((d: string, i: number) => (
          <div
            key={d}
            className="absolute left-0 right-0 rounded-2xl overflow-hidden shadow-md"
            style={{
              top: `${i * (cardHeight * 0.3)}px`,
              height: `${cardHeight}px`,
              background: `linear-gradient(135deg, ${DECADE_COLORS[d] || '#6366f1'}dd, ${DECADE_COLORS[d] || '#6366f1'}88)`,
              zIndex: i,
            }}
          >
            <div className="p-4 text-white h-full flex items-center">
              <div>
                <div className="text-2xl font-black">{DECADE_LABELS[d] || d}</div>
                <div className="text-sm opacity-80 mt-1">经典金曲精选</div>
              </div>
              <div className="ml-auto text-6xl opacity-20 font-black">{d}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
