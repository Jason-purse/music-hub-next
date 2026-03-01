/**
 * LocalStorage - 本地文件系统存储
 * 文件存在 server/uploads/ 目录下，通过 Express static 提供访问
 */
const fs = require('fs');
const path = require('path');
const StorageProvider = require('./base');

class LocalStorage extends StorageProvider {
  constructor(options = {}) {
    super();
    this.baseDir = options.baseDir || path.join(__dirname, '../../uploads');
    this.baseUrl = options.baseUrl || '/uploads';
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async upload(key, buffer, meta = {}) {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return this.getUrl(key);
  }

  async download(key) {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${key}`);
    return fs.readFileSync(filePath);
  }

  async delete(key) {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async list(prefix = '') {
    const dir = path.join(this.baseDir, prefix);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { recursive: true })
      .filter(f => fs.statSync(path.join(dir, f)).isFile())
      .map(f => path.join(prefix, f).replace(/\\/g, '/'));
  }

  getUrl(key) {
    return `${this.baseUrl}/${key}`.replace(/\/+/g, '/').replace(/^\/\//, '/');
  }

  async exists(key) {
    return fs.existsSync(path.join(this.baseDir, key));
  }

  // 直接流式服务给 Express
  createReadStream(key) {
    const filePath = path.join(this.baseDir, key);
    return fs.createReadStream(filePath);
  }
}

module.exports = LocalStorage;
