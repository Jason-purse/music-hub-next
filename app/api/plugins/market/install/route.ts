import { NextRequest, NextResponse } from 'next/server'
import { upsertPlugin } from '@/lib/plugins-db'
import { seedBuiltinPlugins } from '@/lib/plugins/seed'
import { pluginStorage } from '@/lib/plugin-storage'

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

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

/** 从注册表 URL 推导插件文件 base URL（去掉尾部 index.json） */
function getPluginsBase(registryUrl: string): string {
  const base = registryUrl.replace(/\/index\.json$/, '')
  return base + '/plugins'
}

// POST /api/plugins/market/install — 安装插件
export async function POST(req: NextRequest) {
  try { seedBuiltinPlugins() } catch {}

  try {
    const body = await req.json() as { id: string; registryUrl?: string }
    if (!body.id) {
      return NextResponse.json({ error: '缺少插件 id' }, { status: 400 })
    }

    const pluginId = body.id
    const registryUrl = body.registryUrl || 'https://raw.githubusercontent.com/Jason-purse/musichub-plugins/main/index.json'
    const pluginsBase = getPluginsBase(registryUrl)

    // 1. 从注册表找到插件信息
    const registryRes = await fetchWithTimeout(registryUrl)
    if (!registryRes.ok) {
      return NextResponse.json({ error: '无法访问插件注册表' }, { status: 502 })
    }
    const registry: { plugins: RegistryPlugin[] } = await registryRes.json()
    const pluginInfo = registry.plugins.find(p => p.id === pluginId)
    if (!pluginInfo) {
      return NextResponse.json({ error: '插件不存在于注册表中' }, { status: 404 })
    }

    // 2. 下载 manifest.json
    const manifestUrl = `${pluginsBase}/${pluginId}/manifest.json`
    const manifestRes = await fetchWithTimeout(manifestUrl)
    if (!manifestRes.ok) {
      return NextResponse.json({ error: '下载 manifest.json 失败' }, { status: 502 })
    }
    const manifest = await manifestRes.json()
    const manifestContent = JSON.stringify(manifest, null, 2)

    // 3. 下载 webcomponent/index.js
    const scriptUrl = `${pluginsBase}/${pluginId}/webcomponent/index.js`
    const scriptRes = await fetchWithTimeout(scriptUrl)
    if (!scriptRes.ok) {
      return NextResponse.json({ error: '下载 webcomponent/index.js 失败' }, { status: 502 })
    }
    const scriptContent = await scriptRes.text()

    // 4. 通过 pluginStorage 写入（自动切换 FS / GitHub）
    await pluginStorage.write(pluginId, 'manifest.json', manifestContent, `Install plugin: ${pluginId}`)
    await pluginStorage.write(pluginId, 'webcomponent/index.js', scriptContent, `Install plugin: ${pluginId}`)

    // 5. 种入 DB（community 默认 disabled）
    const dbManifest = {
      id: manifest.id || pluginId,
      name: manifest.name || pluginInfo.name,
      version: manifest.version || pluginInfo.version,
      category: manifest.category || 'feature' as const,
      priority: manifest.priority ?? 10,
      tier: (manifest.tier || pluginInfo.tier || 'community') as 'community',
      description: manifest.description || pluginInfo.description,
      author: manifest.author || pluginInfo.author,
    }
    upsertPlugin(dbManifest, false)

    return NextResponse.json({
      success: true,
      plugin: { id: pluginId, name: dbManifest.name },
    })
  } catch (e) {
    console.error('[market/install] error:', e)
    return NextResponse.json({ error: '安装失败: ' + String(e) }, { status: 500 })
  }
}
