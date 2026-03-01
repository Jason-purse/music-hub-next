/**
 * lib/db/providers/local.ts — 本地文件 Provider
 *
 * 读写本地 data/db.json，开发时单进程，无需任何外部服务。
 * 注册名: "local"
 */
import fs from 'fs';
import path from 'path';
import type { DBProvider, DBData } from '../types';

export class LocalFileProvider implements DBProvider {
  private readonly dbPath: string;

  constructor() {
    this.dbPath = process.env.LOCAL_DB_PATH
      || path.join(process.cwd(), 'data', 'db.json');
  }

  async read(): Promise<DBData> {
    const raw = fs.readFileSync(this.dbPath, 'utf-8');
    return JSON.parse(raw) as DBData;
  }

  async write(data: DBData): Promise<void> {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
