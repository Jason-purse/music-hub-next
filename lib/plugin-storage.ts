// 存储抽象层 — 自动切换本地 FS 和 GitHub API
// GITHUB_TOKEN 存在 → GitHub；不存在 → 本地文件系统

import fs from 'fs'
import path from 'path'
import { githubRead, githubWrite, githubDelete } from './github-storage'

const isGitHub = () => !!process.env.GITHUB_TOKEN

// 相对于 content/installed-plugins/ 的路径
const getBaseDir = () => path.join(process.cwd(), 'content', 'installed-plugins')

export const pluginStorage = {
  /**
   * 读取插件文件内容
   * @param pluginId - 插件 ID
   * @param filePath - 插件内相对路径 (e.g. "manifest.json", "webcomponent/index.js")
   */
  read: async (pluginId: string, filePath: string): Promise<string | null> => {
    const relativePath = `content/installed-plugins/${pluginId}/${filePath}`
    if (isGitHub()) {
      const result = await githubRead(relativePath)
      return result?.content ?? null
    }
    const fullPath = path.join(getBaseDir(), pluginId, filePath)
    if (!fs.existsSync(fullPath)) return null
    return fs.readFileSync(fullPath, 'utf-8')
  },

  /**
   * 写入插件文件
   * @param pluginId - 插件 ID
   * @param filePath - 插件内相对路径
   * @param content - 文件内容
   * @param commitMsg - GitHub commit message（本地模式忽略）
   */
  write: async (pluginId: string, filePath: string, content: string, commitMsg?: string): Promise<void> => {
    const relativePath = `content/installed-plugins/${pluginId}/${filePath}`
    if (isGitHub()) {
      const existing = await githubRead(relativePath)
      await githubWrite(relativePath, content, existing?.sha, commitMsg || `Install plugin: ${pluginId}`)
      return
    }
    const fullPath = path.join(getBaseDir(), pluginId, filePath)
    fs.mkdirSync(path.dirname(fullPath), { recursive: true })
    fs.writeFileSync(fullPath, content, 'utf-8')
  },

  /**
   * 删除插件的所有文件
   * @param pluginId - 插件 ID
   * @param commitMsg - GitHub commit message（本地模式忽略）
   */
  delete: async (pluginId: string, commitMsg?: string): Promise<void> => {
    const files = ['manifest.json', 'webcomponent/index.js']
    if (isGitHub()) {
      for (const f of files) {
        const relativePath = `content/installed-plugins/${pluginId}/${f}`
        const existing = await githubRead(relativePath)
        if (existing) await githubDelete(relativePath, existing.sha, commitMsg || `Uninstall plugin: ${pluginId}`)
      }
      return
    }
    const dir = path.join(getBaseDir(), pluginId)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  },

  /**
   * 检查插件文件是否存在
   */
  exists: async (pluginId: string, filePath: string): Promise<boolean> => {
    const relativePath = `content/installed-plugins/${pluginId}/${filePath}`
    if (isGitHub()) {
      const result = await githubRead(relativePath)
      return result !== null
    }
    return fs.existsSync(path.join(getBaseDir(), pluginId, filePath))
  },
}
