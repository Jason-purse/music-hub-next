'use client'
import { BackToTop } from './BackToTop'
import { ReadingProgress } from './ReadingProgress'

interface EnabledPlugin {
  id: string
  userConfig: Record<string, unknown>
}

interface Props {
  enabledPlugins: EnabledPlugin[]
}

export function PluginUIHost({ enabledPlugins }: Props) {
  const isEnabled = (id: string) => enabledPlugins.some(p => p.id === id)
  const getConfig = (id: string): Record<string, unknown> =>
    enabledPlugins.find(p => p.id === id)?.userConfig ?? {}

  return (
    <>
      {isEnabled('reading-progress') && (
        <ReadingProgress
          color={(getConfig('reading-progress').color as string) ?? '#6366f1'}
          height={(getConfig('reading-progress').height as number) ?? 3}
        />
      )}
      {isEnabled('back-to-top') && (
        <BackToTop
          threshold={(getConfig('back-to-top').threshold as number) ?? 0}
        />
      )}
    </>
  )
}
