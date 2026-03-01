/**
 * OSSStorage - 阿里云 OSS 存储
 * 需要安装: npm install ali-oss
 */
const StorageProvider = require('./base');

class OSSStorage extends StorageProvider {
  constructor(options = {}) {
    super();
    try {
      const OSS = require('ali-oss');
      this.client = new OSS({
        region: options.region || process.env.OSS_REGION || 'oss-cn-hangzhou',
        accessKeyId: options.accessKeyId || process.env.OSS_ACCESS_KEY_ID,
        accessKeySecret: options.accessKeySecret || process.env.OSS_ACCESS_KEY_SECRET,
        bucket: options.bucket || process.env.OSS_BUCKET,
      });
      this.cdnBase = options.cdnBase || process.env.OSS_CDN_BASE || '';
      this.bucket = options.bucket || process.env.OSS_BUCKET;
      this.region = options.region || process.env.OSS_REGION || 'oss-cn-hangzhou';
    } catch (e) {
      throw new Error('OSSStorage requires ali-oss: npm install ali-oss');
    }
  }

  async upload(key, buffer, meta = {}) {
    const result = await this.client.put(key, buffer, {
      headers: { 'Content-Type': meta.contentType || 'audio/mpeg' },
    });
    return this.getUrl(key);
  }

  async download(key) {
    const result = await this.client.get(key);
    return result.content;
  }

  async delete(key) {
    await this.client.delete(key);
  }

  async list(prefix = '') {
    const result = await this.client.list({ prefix, 'max-keys': 1000 });
    return (result.objects || []).map(o => o.name);
  }

  getUrl(key) {
    if (this.cdnBase) return `${this.cdnBase}/${key}`;
    return `https://${this.bucket}.${this.region}.aliyuncs.com/${key}`;
  }

  async exists(key) {
    try { await this.client.head(key); return true; } catch { return false; }
  }
}

module.exports = OSSStorage;
