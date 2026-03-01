'use client'

export function HeroBannerPreview({ props }: { props: any }) {
  return (
    <div
      style={{ background: props.bgColor || '#6366f1', color: props.textColor || '#fff' }}
      className="w-full py-16 px-8 text-center rounded-xl"
    >
      <h1 className="text-4xl font-bold">{props.title || '页面标题'}</h1>
      {props.subtitle && <p className="text-lg mt-3 opacity-80">{props.subtitle}</p>}
    </div>
  )
}
