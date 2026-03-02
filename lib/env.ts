/** 获取当前运行环境信息 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isVercel: !!process.env.VERCEL,
    hasGitHubToken: !!process.env.GITHUB_TOKEN,
    pluginStorageMode: process.env.GITHUB_TOKEN ? 'github' : 'filesystem' as const,
  }
}
