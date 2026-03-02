/**
 * BlockRegistry — 积木注册表单例
 *
 * 所有 content + layout 积木在这里注册。
 * 客户端安全：只含 React 组件 + 元数据，无服务端逻辑。
 */
import type { BlockDef } from './types/block-def'

class BlockRegistry {
  private map = new Map<string, BlockDef>()

  register(def: BlockDef): this {
    this.map.set(def.type, def)
    return this
  }

  get(type: string): BlockDef | undefined {
    return this.map.get(type)
  }

  getAll(): BlockDef[] {
    return Array.from(this.map.values())
  }

  getByCategory(category: string): BlockDef[] {
    return this.getAll().filter(d => d.category === category)
  }

  getByTag(tag: string): BlockDef[] {
    return this.getAll().filter(d => d.tags.includes(tag))
  }

  getContainers(): BlockDef[] {
    return this.getAll().filter(d => d.isContainer)
  }

  getLeaves(): BlockDef[] {
    return this.getAll().filter(d => !d.isContainer)
  }
}

export const blockRegistry = new BlockRegistry()
