/**
 * Storage Factory - 根据配置创建对应存储实例
 *
 * 通过 .env 配置:
 *   STORAGE_PROVIDER=local       # local | github | oss | s3 | r2
 *
 * 也可代码指定:
 *   const storage = createStorage('github', { owner: 'xxx', token: 'xxx' })
 */
const LocalStorage = require('./local');
const GitHubStorage = require('./github');

function createStorage(provider, options = {}) {
  provider = provider || process.env.STORAGE_PROVIDER || 'local';
  switch (provider.toLowerCase()) {
    case 'local':
      return new LocalStorage(options);
    case 'github':
      return new GitHubStorage(options);
    case 'oss':
      const OSSStorage = require('./oss');
      return new OSSStorage(options);
    case 's3':
    case 'r2':
      const S3Storage = require('./s3');
      return new S3Storage(options);
    default:
      throw new Error(`Unknown storage provider: ${provider}. Available: local, github, oss, s3, r2`);
  }
}

// 默认实例（单例，从环境变量初始化）
let _defaultStorage = null;
function getStorage() {
  if (!_defaultStorage) {
    _defaultStorage = createStorage();
  }
  return _defaultStorage;
}

// 重置（测试用 / 切换 provider 时用）
function resetStorage() { _defaultStorage = null; }

module.exports = { createStorage, getStorage, resetStorage };
