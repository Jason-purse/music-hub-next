/**
 * lib/db/providers/github.ts — GitHub 仓库 Provider
 *
 * 通过 GitHub Contents API 读写 db.json。
 * 生产环境（Vercel）默认使用此 Provider。
 * 注册名: "github"
 */
import { Octokit } from '@octokit/rest';
import type { DBProvider, DBData } from '../types';

export class GitHubProvider implements DBProvider {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_PAT,
      ...(process.env.GITHUB_API_URL ? { baseUrl: process.env.GITHUB_API_URL } : {}),
    });
    this.owner  = process.env.GITHUB_OWNER!;
    this.repo   = process.env.GITHUB_DB_REPO   || 'music-hub-db';
    this.branch = process.env.GITHUB_DB_BRANCH || 'main';
  }

  async read(): Promise<DBData> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner, repo: this.repo, path: 'db.json', ref: this.branch,
    });
    if (Array.isArray(data) || data.type !== 'file') throw new Error('db.json is not a file');
    return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')) as DBData;
  }

  async write(data: DBData, message = 'chore: update db'): Promise<void> {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    let sha = '';
    try {
      const { data: f } = await this.octokit.repos.getContent({
        owner: this.owner, repo: this.repo, path: 'db.json', ref: this.branch,
      });
      if (!Array.isArray(f) && f.type === 'file') sha = f.sha;
    } catch { /* 文件不存在时 sha 为空，触发 create */ }
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner, repo: this.repo, path: 'db.json',
      branch: this.branch, message, content, sha,
    });
  }
}
