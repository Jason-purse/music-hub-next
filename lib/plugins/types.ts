export interface SlotDefinition {
  name: string
  label: string
  acceptedBlockTypes?: string[]
  minBlocks?: number
  maxBlocks?: number
}

export interface LayoutPlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  thumbnail?: string
  tags?: string[]
  builtIn?: boolean           // 内置插件标记
  slotDefinitions: SlotDefinition[]
  // 骨架选项数据（用于编辑器骨架选择器）
  layoutOption: {
    value: string
    label: string
    icon: string
  }
}

export interface MarketPlugin extends LayoutPlugin {
  downloadUrl?: string       // 可选远程下载地址
  installed?: boolean
  enabled?: boolean
}

export interface MarketManifest {
  version: string
  plugins: MarketPlugin[]
}
