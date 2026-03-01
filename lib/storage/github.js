/**
 * GitHubStorage - 使用 GitHub 仓库存储文件
 * 适合个人用途，文件通过 raw.githubusercontent.com 公开访问
 * 限制: 单文件 < 100MB，仓库总量建议 < 1GB
 */
const { Octokit } = require('@octokit/rest');
const StorageProvider = require('./base');

class GitHubStorage extends StorageProvider {
  constructor(options = {}) {
    super();
    const token = options.token || process.env.STORAGE_GITHUB_TOKEN || process.env.GITHUB_PAT;
    const owner = options.owner || process.env.STORAGE_GITHUB_OWNER || process.env.GITHUB_OWNER;
    const repo  = options.repo  || process.env.STORAGE_GITHUB_REPO  || 'music-hub-files';
    const branch = options.branch || process.env.STORAGE_GITHUB_BRANCH || 'main';

    if (!token || !owner) throw new Error('GitHubStorage requires token + owner');

    const apiUrl = options.apiUrl || process.env.GITHUB_API_URL;
    this.octokit = new Octokit({
      auth: token,
      ...(apiUrl ? { baseUrl: apiUrl } : {}),
    });
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
  }

  async upload(key, buffer, meta = {}) {
    const content = buffer.toString('base64');
    let sha;
    // 检查文件是否已存在（获取 sha 用于更新）
    try {
      const { data } = await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: key, ref: this.branch });
      sha = data.sha;
    } catch (e) { /* 新文件，不需要 sha */ }

    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: key,
      message: `Add ${meta.title || key}`,
      content,
      branch: this.branch,
      ...(sha ? { sha } : {}),
    });
    return this.getUrl(key);
  }

  async download(key) {
    const { data } = await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: key, ref: this.branch });
    return Buffer.from(data.content, 'base64');
  }

  async delete(key) {
    let sha;
    try {
      const { data } = await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: key });
      sha = data.sha;
    } catch { return; }
    await this.octokit.repos.deleteFile({ owner: this.owner, repo: this.repo, path: key, message: `Delete ${key}`, sha, branch: this.branch });
  }

  async list(prefix = '') {
    try {
      const { data } = await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: prefix || '/', ref: this.branch });
      if (Array.isArray(data)) {
        return data.filter(f => f.type === 'file').map(f => f.path);
      }
      return [data.path];
    } catch { return []; }
  }

  getUrl(key) {
    return `${this.rawBase}/${key}`;
  }

  async exists(key) {
    try {
      await this.octokit.repos.getContent({ owner: this.owner, repo: this.repo, path: key, ref: this.branch });
      return true;
    } catch { return false; }
  }

  // 确保仓库存在，不存在则创建
  async ensureRepo() {
    try {
      await this.octokit.repos.get({ owner: this.owner, repo: this.repo });
    } catch (e) {
      if (e.status === 404) {
        await this.octokit.repos.createForAuthenticatedUser({ name: this.repo, private: false, description: 'Music Hub audio files storage' });
        // 创建初始文件（空仓库无法操作）
        await this.octokit.repos.createOrUpdateFileContents({ owner: this.owner, repo: this.repo, path: 'README.md', message: 'Init', content: Buffer.from('# Music Hub Files\nAudio files storage for Music Hub').toString('base64'), branch: this.branch });
      } else throw e;
    }
  }
}

module.exports = GitHubStorage;
