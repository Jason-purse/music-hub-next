/**
 * S3Storage - AWS S3 / Cloudflare R2 / 任何 S3 兼容存储
 * 需要安装: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * Cloudflare R2 配置示例（推荐，免费出口流量）:
 *   S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
 *   S3_REGION=auto
 *   S3_ACCESS_KEY_ID=<r2_access_key>
 *   S3_SECRET_ACCESS_KEY=<r2_secret>
 *   S3_BUCKET=music-hub
 *   S3_CDN_BASE=https://pub-xxx.r2.dev
 */
const StorageProvider = require('./base');

class S3Storage extends StorageProvider {
  constructor(options = {}) {
    super();
    try {
      const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
      const config = {
        region: options.region || process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: options.accessKeyId || process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: options.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY,
        },
      };
      const endpoint = options.endpoint || process.env.S3_ENDPOINT;
      if (endpoint) config.endpoint = endpoint;
      this.client = new S3Client(config);
      this.bucket = options.bucket || process.env.S3_BUCKET;
      this.cdnBase = options.cdnBase || process.env.S3_CDN_BASE || '';
      this.Commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand };
    } catch (e) {
      throw new Error('S3Storage requires @aws-sdk/client-s3: npm install @aws-sdk/client-s3');
    }
  }

  async upload(key, buffer, meta = {}) {
    const { PutObjectCommand } = this.Commands;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: meta.contentType || 'audio/mpeg',
    }));
    return this.getUrl(key);
  }

  async download(key) {
    const { GetObjectCommand } = this.Commands;
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks = [];
    for await (const chunk of result.Body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async delete(key) {
    const { DeleteObjectCommand } = this.Commands;
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async list(prefix = '') {
    const { ListObjectsV2Command } = this.Commands;
    const result = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, MaxKeys: 1000 }));
    return (result.Contents || []).map(o => o.Key);
  }

  getUrl(key) {
    if (this.cdnBase) return `${this.cdnBase}/${key}`;
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async exists(key) {
    const { HeadObjectCommand } = this.Commands;
    try { await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key })); return true; } catch { return false; }
  }
}

module.exports = S3Storage;
