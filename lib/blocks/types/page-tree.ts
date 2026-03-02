/**
 * PageNode — 页面树的节点数据模型
 * 
 * 替代原来的扁平 Block 数组。每个节点可以是：
 *   - Content 节点：叶子，只有 type + props
 *   - Layout 节点：容器，有 slots（每个 slot 含子 PageNode 数组）
 */
export interface PageNode {
  id: string
  type: string
  props: Record<string, unknown>
  label?: string
  /** Layout 节点专用：key=slotName, value=子节点列表 */
  slots?: { [slotName: string]: PageNode[] }
}

export interface PageTree {
  /** 画布顶层节点列表 */
  nodes: PageNode[]
}
