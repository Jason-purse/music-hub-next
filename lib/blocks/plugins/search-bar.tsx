// 无 'use client'：此文件在服务端注册插件，Component 引用客户端组件（Next.js 允许）
import { BlockPlugin } from '../types'
import { SearchBarComponent } from './search-bar.client'

interface SearchBarProps {
  placeholder: string
  tags: string
}

export const SearchBarBlock: BlockPlugin<SearchBarProps> = {
  type: 'search-bar',
  label: '搜索框',
  icon: '🔍',
  defaultProps: {
    placeholder: '搜索歌曲、歌手…',
    tags: '流行,摇滚,民谣,电子',
  },
  fields: [
    { name: 'placeholder', label: '占位文字', type: 'text' },
    { name: 'tags', label: '推荐标签（逗号分隔）', type: 'text' },
  ],
  Component: SearchBarComponent,
}
