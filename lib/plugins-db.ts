/**
 * lib/plugins-db.ts — Plugin SQLite store
 *
 * Manages the `plugins` table in music-hub.db using better-sqlite3.
 * This is separate from the main JSON-based DB provider.
 */
import Database from 'better-sqlite3'
import path from 'path'
import type { InstalledPlugin, PluginManifest } from '@/types/plugin'

const DB_PATH = path.join(process.cwd(), 'music-hub.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.exec(`
    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT DEFAULT '1.0.0',
      category TEXT DEFAULT 'feature',
      enabled INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 10,
      config JSON DEFAULT '{}',
      manifest JSON DEFAULT '{}',
      installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
  _db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_data (
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (plugin_id, key)
    );
  `)
  return _db
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function getAllPlugins(): InstalledPlugin[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM plugins ORDER BY priority ASC').all() as any[]
  return rows.map(rowToPlugin)
}

export function getPluginById(id: string): InstalledPlugin | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM plugins WHERE id = ?').get(id) as any
  return row ? rowToPlugin(row) : null
}

// ── Write ────────────────────────────────────��───────────────────────────────

export function upsertPlugin(plugin: PluginManifest, defaultEnabled = true): InstalledPlugin {
  const db = getDb()
  const existing = getPluginById(plugin.id)
  if (existing) return existing

  db.prepare(`
    INSERT INTO plugins (id, name, version, category, enabled, priority, config, manifest)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    plugin.id,
    plugin.name,
    plugin.version || '1.0.0',
    plugin.category || 'feature',
    defaultEnabled ? 1 : 0,
    plugin.priority ?? 10,
    '{}',
    JSON.stringify(plugin),
  )
  return getPluginById(plugin.id)!
}

export function updatePlugin(id: string, patch: { enabled?: boolean; config?: Record<string, unknown> }): InstalledPlugin | null {
  const db = getDb()
  const existing = getPluginById(id)
  if (!existing) return null

  if (patch.enabled !== undefined) {
    db.prepare('UPDATE plugins SET enabled = ? WHERE id = ?').run(patch.enabled ? 1 : 0, id)
  }
  if (patch.config !== undefined) {
    db.prepare('UPDATE plugins SET config = ? WHERE id = ?').run(JSON.stringify(patch.config), id)
  }
  return getPluginById(id)
}

export function updatePluginManifest(id: string, manifest: PluginManifest): void {
  const db = getDb()
  db.prepare('UPDATE plugins SET manifest = ?, name = ?, version = ?, category = ?, priority = ? WHERE id = ?')
    .run(JSON.stringify(manifest), manifest.name, manifest.version || '1.0.0', manifest.category || 'feature', manifest.priority ?? 0, id)
}

export function deletePlugin(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM plugins WHERE id = ?').run(id)
  return result.changes > 0
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToPlugin(row: any): InstalledPlugin {
  const manifest: PluginManifest = (() => {
    try { return JSON.parse(row.manifest || '{}') } catch { return {} as PluginManifest }
  })()
  const userConfig: Record<string, unknown> = (() => {
    try { return JSON.parse(row.config || '{}') } catch { return {} }
  })()

  return {
    id: row.id,
    name: row.name,
    version: row.version,
    category: row.category,
    priority: row.priority,
    enabled: !!row.enabled,
    builtin: manifest.builtin,
    tier: manifest.tier,
    defaultEnabled: manifest.defaultEnabled,
    uiSlots: manifest.uiSlots,
    description: manifest.description,
    configSchema: manifest.configSchema,
    adminMenu: manifest.adminMenu,
    slots: manifest.slots,
    apiPrefix: manifest.apiPrefix,
    pagePrefix: manifest.pagePrefix,
    userConfig,
    installedAt: row.installed_at,
  }
}

/** 获取插件的原始 manifest JSON（包含系统扩展字段）*/
export function getPluginRawManifest(id: string): Record<string, unknown> | null {
  const db = getDb()
  const row = db.prepare('SELECT manifest FROM plugins WHERE id = ?').get(id) as { manifest: string } | undefined
  if (!row) return null
  try { return JSON.parse(row.manifest || '{}') } catch { return null }
}

/** 获取所有插件的原始 manifest（用于系统级路由/slot 查询）*/
export function getAllPluginsRaw(): { id: string; enabled: boolean; userConfig: Record<string, unknown>; manifest: Record<string, unknown> }[] {
  const db = getDb()
  const rows = db.prepare('SELECT id, enabled, config, manifest FROM plugins').all() as {
    id: string; enabled: number; config: string; manifest: string
  }[]
  return rows.map(r => ({
    id: r.id,
    enabled: !!r.enabled,
    userConfig: (() => { try { return JSON.parse(r.config || '{}') } catch { return {} } })(),
    manifest: (() => { try { return JSON.parse(r.manifest || '{}') } catch { return {} } })(),
  }))
}

// ── Plugin Data Store ────────────────────────────────────────────────────────

/** 获取插件的全部数据 key-value pairs */
export function getPluginData(pluginId: string): Record<string, string> {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM plugin_data WHERE plugin_id = ?').all(pluginId) as { key: string; value: string }[]
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

/** 写入或更新插件数据 */
export function setPluginData(pluginId: string, key: string, value: string): void {
  const db = getDb()
  db.prepare(
    'INSERT OR REPLACE INTO plugin_data (plugin_id, key, value, updated_at) VALUES (?, ?, ?, ?)'
  ).run(pluginId, key, value, Date.now())
}

/** 删除插件数据的某个 key */
export function deletePluginData(pluginId: string, key: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM plugin_data WHERE plugin_id = ? AND key = ?').run(pluginId, key)
  return result.changes > 0
}
