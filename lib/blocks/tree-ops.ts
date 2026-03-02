/**
 * tree-ops.ts — PageNode 树的不可变 CRUD 操作
 *
 * 所有操作返回新的 nodes 数组（顶层），不会修改原始数据。
 * droppableId 格式：`{nodeId}::{slotName}`，顶层 = `root::main`
 */
import type { PageNode } from './types/page-tree'
import type { BlockDef } from './types/block-def'

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

export function genId(): string {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/** 根据 droppableId 解析出 nodeId 和 slotName */
export function parseDroppableId(id: string): { nodeId: string; slotName: string } {
  const [nodeId, slotName] = id.split('::')
  return { nodeId, slotName }
}

export function makeDroppableId(nodeId: string, slotName: string): string {
  return `${nodeId}::${slotName}`
}

// ─── 查找 ─────────────────────────────────────────────────────────────────────

/** 在树中找到一个节点，返回节点及其路径 */
export interface NodeLocation {
  node: PageNode
  parentNodes: PageNode[]      // 从顶层到所在数组的引用路径
  parentSlotName: string       // 在哪个 slot 里
  index: number                // 在 slot 数组中的位置
}

export function findNodeById(nodes: PageNode[], id: string): NodeLocation | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { node: nodes[i], parentNodes: nodes, parentSlotName: 'main', index: i }
    }
    if (nodes[i].slots) {
      for (const [slotName, children] of Object.entries(nodes[i].slots!)) {
        const result = findNodeInSlot(children, id, slotName)
        if (result) return result
      }
    }
  }
  return null
}

function findNodeInSlot(nodes: PageNode[], id: string, slotName: string): NodeLocation | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return { node: nodes[i], parentNodes: nodes, parentSlotName: slotName, index: i }
    }
    if (nodes[i].slots) {
      for (const [childSlotName, children] of Object.entries(nodes[i].slots!)) {
        const result = findNodeInSlot(children, id, childSlotName)
        if (result) return result
      }
    }
  }
  return null
}

/** 获取指定 droppableId 对应的节点数组（可能是顶层 nodes 或某个 node 的 slot） */
function getSlotArray(nodes: PageNode[], droppableId: string): PageNode[] | null {
  const { nodeId, slotName } = parseDroppableId(droppableId)
  if (nodeId === 'root') return nodes
  const loc = findNodeById(nodes, nodeId)
  if (!loc) return null
  return loc.node.slots?.[slotName] ?? null
}

// ─── 插入节点 ──────────────────────────────────────────────────────────────────

export function insertNode(
  nodes: PageNode[],
  droppableId: string,
  index: number,
  newNode: PageNode,
): PageNode[] {
  const { nodeId, slotName } = parseDroppableId(droppableId)

  if (nodeId === 'root') {
    const result = [...nodes]
    result.splice(index, 0, newNode)
    return result
  }

  return nodes.map(n => insertNodeInto(n, nodeId, slotName, index, newNode))
}

function insertNodeInto(
  node: PageNode, targetId: string, targetSlot: string, index: number, newNode: PageNode,
): PageNode {
  if (node.id === targetId) {
    const slots = { ...node.slots }
    const arr = [...(slots[targetSlot] || [])]
    arr.splice(index, 0, newNode)
    slots[targetSlot] = arr
    return { ...node, slots }
  }
  if (!node.slots) return node
  const newSlots: Record<string, PageNode[]> = {}
  let changed = false
  for (const [sn, children] of Object.entries(node.slots)) {
    const mapped = children.map(c => insertNodeInto(c, targetId, targetSlot, index, newNode))
    newSlots[sn] = mapped
    if (mapped !== children) changed = true
  }
  return changed ? { ...node, slots: newSlots } : node
}

// ─── 删除节点 ──────────────────────────────────────────────────────────────────

export function deleteNode(nodes: PageNode[], id: string): PageNode[] {
  const result: PageNode[] = []
  for (const n of nodes) {
    if (n.id === id) continue
    if (n.slots) {
      const newSlots: Record<string, PageNode[]> = {}
      for (const [sn, children] of Object.entries(n.slots)) {
        newSlots[sn] = deleteNode(children, id)
      }
      result.push({ ...n, slots: newSlots })
    } else {
      result.push(n)
    }
  }
  return result
}

// ─── 更新节点 props ────────────────────────────────────────────────────────────

export function updateNodeProps(
  nodes: PageNode[], id: string, props: Record<string, unknown>,
): PageNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, props }
    if (n.slots) {
      const newSlots: Record<string, PageNode[]> = {}
      for (const [sn, children] of Object.entries(n.slots)) {
        newSlots[sn] = updateNodeProps(children, id, props)
      }
      return { ...n, slots: newSlots }
    }
    return n
  })
}

// ─── 更新节点 label ────────────────────────────────────────────────────────────

export function updateNodeLabel(
  nodes: PageNode[], id: string, label: string | undefined,
): PageNode[] {
  return nodes.map(n => {
    if (n.id === id) return { ...n, label }
    if (n.slots) {
      const newSlots: Record<string, PageNode[]> = {}
      for (const [sn, children] of Object.entries(n.slots)) {
        newSlots[sn] = updateNodeLabel(children, id, label)
      }
      return { ...n, slots: newSlots }
    }
    return n
  })
}

// ─── 移动节点（跨 slot / 跨容器） ─────────────────────────────────────────────

export function moveNode(
  nodes: PageNode[],
  nodeId: string,
  fromDroppableId: string,
  fromIndex: number,
  toDroppableId: string,
  toIndex: number,
): PageNode[] {
  // 先找到并取出节点
  const loc = findNodeById(nodes, nodeId)
  if (!loc) return nodes

  // 删除原位置
  let result = deleteNode(nodes, nodeId)

  // 如果同一个 droppable 且 toIndex > fromIndex，需要减 1（因为删除了一个元素）
  let adjustedIndex = toIndex
  if (fromDroppableId === toDroppableId && toIndex > fromIndex) {
    adjustedIndex = toIndex - 1
  }

  // 在新位置插入
  result = insertNode(result, toDroppableId, adjustedIndex, loc.node)

  return result
}

// ─── 从 BlockDef 创建新 PageNode ──────────────────────────────────────────────

export function createNodeFromDef(def: BlockDef): PageNode {
  const node: PageNode = {
    id: genId(),
    type: def.type,
    props: { ...def.defaultProps },
  }
  if (def.isContainer && def.slots) {
    node.slots = {}
    for (const slot of def.slots) {
      node.slots[slot.name] = []
    }
  }
  return node
}

// ─── 递归遍历所有节点 ─────────────────────────────────────────────────────────

export function walkNodes(nodes: PageNode[], cb: (node: PageNode, depth: number) => void, depth = 0): void {
  for (const n of nodes) {
    cb(n, depth)
    if (n.slots) {
      for (const children of Object.values(n.slots)) {
        walkNodes(children, cb, depth + 1)
      }
    }
  }
}
