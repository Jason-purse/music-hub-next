/**
 * StorageProvider 抽象接口
 * 所有实现必须提供以下方法
 */
class StorageProvider {
  /**
   * 上传文件
   * @param {string} key - 存储路径，如 music/song-id.mp3
   * @param {Buffer} buffer - 文件内容
   * @param {object} meta - { contentType, title, artist }
   * @returns {Promise<string>} publicUrl
   */
  async upload(key, buffer, meta = {}) { throw new Error('Not implemented'); }

  /**
   * 下载文件
   * @param {string} key
   * @returns {Promise<Buffer>}
   */
  async download(key) { throw new Error('Not implemented'); }

  /**
   * 删除文件
   * @param {string} key
   */
  async delete(key) { throw new Error('Not implemented'); }

  /**
   * 列出文件
   * @param {string} prefix
   * @returns {Promise<string[]>} keys
   */
  async list(prefix = '') { throw new Error('Not implemented'); }

  /**
   * 获取公开 URL（不下载）
   * @param {string} key
   * @returns {string}
   */
  getUrl(key) { throw new Error('Not implemented'); }

  /**
   * 检查文件是否存在
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try { await this.download(key); return true; } catch { return false; }
  }
}

module.exports = StorageProvider;
