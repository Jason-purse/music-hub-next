import { NextResponse } from 'next/server'
import { getAllPlugins } from '@/lib/plugins-db'
import { seedBuiltinPlugins } from '@/lib/plugins/seed'
import { getEnabledRegistries } from '@/lib/plugin-registries'
import type { PluginRegistry } from '@/lib/plugin-registries'

interface RegistryPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  tags: string[]
  tier: string
  thumbnail?: string
}

interface MarketPlugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  tags: string[]
  tier: string
  thumbnail?: string
  installed: boolean
  installedVersion?: string
  hasUpdate: boolean
  registryId: string
  registryName: string
  registryUrl: string
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

async function fetchRegistry(registry: PluginRegistry): Promise<{ plugins: RegistryPlugin[]; registry: PluginRegistry } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(registry.url, { signal: controller.signal, next: { revalidate: 60 } })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data: { plugins: RegistryPlugin[] } = await res.json()
    return { plugins: data.plugins || [], registry }
  } catch {
    return null
  }
}

// GET /api/plugins/market — 从所有 enabled 注册表并发拉取，合并本地安装状态
export async function GET() {
  try { seedBuiltinPlugins() } catch {}

  const registries = getEnabledRegistries()
  if (registries.length === 0) {
    return NextResponse.json({ plugins: [], error: '没有启用的插件注册表' })
  }

  const results = await Promise.all(registries.map(r => fetchRegistry(r)))
  const successCount = results.filter(Boolean).length

  if (successCount === 0) {
    return NextResponse.json({ plugins: [], error: '插件市场暂时不可用' })
  }

  const installed = getAllPlugins()
  const installedMap = new Map(installed.map(p => [p.id, p]))

  // 合并所有注册表结果，同 id 插件以先出现的为准
  const seen = new Set<string>()
  const plugins: MarketPlugin[] = []

  for (const result of results) {
    if (!result) continue
    for (const rp of result.plugins) {
      if (seen.has(rp.id)) continue
      seen.add(rp.id)
      const local = installedMap.get(rp.id)
      plugins.push({
        id: rp.id,
        name: rp.name,
        version: rp.version,
        description: rp.description,
        author: rp.author,
        tags: rp.tags || [],
        tier: rp.tier,
        thumbnail: rp.thumbnail,
        installed: !!local,
        installedVersion: local?.version,
        hasUpdate: local ? compareVersions(rp.version, local.version) > 0 : false,
        registryId: result.registry.id,
        registryName: result.registry.name,
        registryUrl: result.registry.url,
      })
    }
  }

  const failedCount = results.filter(r => !r).length
  const warning = failedCount > 0 ? `${failedCount} 个注册表连接失败` : undefined

  return NextResponse.json({ plugins, warning })
}
