import { LayoutPlugin, MarketPlugin } from './types'

export const BUILTIN_PLUGINS: LayoutPlugin[] = [
  {
    id: 'layout-single-col',
    name: '单列布局',
    description: '简洁单列，适合文章、列表类页面',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['基础'],
    slotDefinitions: [{ name: 'main', label: '主区域' }],
    layoutOption: { value: 'single-col', label: '单列', icon: '▬' }
  },
  {
    id: 'layout-two-col-sidebar',
    name: '主+侧边栏',
    description: '2/3主内容区 + 1/3侧边栏',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['基础'],
    slotDefinitions: [
      { name: 'main', label: '主区域' },
      { name: 'sidebar', label: '侧边栏', maxBlocks: 5 }
    ],
    layoutOption: { value: 'two-col-sidebar', label: '主+侧边栏', icon: '▬▮' }
  },
  {
    id: 'layout-hero-then-content',
    name: 'Hero+内容区',
    description: '全宽Hero区域 + 下方内容',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['基础'],
    slotDefinitions: [
      { name: 'hero', label: 'Hero 区', maxBlocks: 2 },
      { name: 'content', label: '内容区' }
    ],
    layoutOption: { value: 'hero-then-content', label: 'Hero+内容区', icon: '⬛▬' }
  },
  {
    id: 'layout-two-col-equal',
    name: '双列均分',
    description: '左右各50%均分',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['基础'],
    slotDefinitions: [
      { name: 'left', label: '左列' },
      { name: 'right', label: '右列' }
    ],
    layoutOption: { value: 'two-col-equal', label: '双列均分', icon: '▮▮' }
  },
  {
    id: 'layout-three-col',
    name: '三列布局',
    description: '三列均分，适合卡片展示',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['多列'],
    slotDefinitions: [
      { name: 'col1', label: '第一列' },
      { name: 'col2', label: '第二列' },
      { name: 'col3', label: '第三列' }
    ],
    layoutOption: { value: 'three-col', label: '三列', icon: '▮▮▮' }
  },
  {
    id: 'layout-hero-full',
    name: '全宽Hero',
    description: '单个全宽区域，适合Landing Page',
    version: '1.0.0', author: 'MusicHub', builtIn: true, tags: ['基础'],
    slotDefinitions: [{ name: 'hero', label: 'Hero 区' }],
    layoutOption: { value: 'hero-full', label: '全宽Hero', icon: '⬛' }
  },
]

export const MARKET_PLUGINS: MarketPlugin[] = [
  {
    id: 'layout-magazine',
    name: '杂志三栏布局',
    description: '左侧大图主视觉，右侧上下分区，适合音乐专辑推荐页面',
    version: '1.0.0', author: 'Community', tags: ['杂志', '精选'],
    thumbnail: '',
    slotDefinitions: [
      { name: 'hero', label: '主视觉', maxBlocks: 1 },
      { name: 'top-right', label: '右上区', maxBlocks: 3 },
      { name: 'bottom-right', label: '右下区', maxBlocks: 2 }
    ],
    layoutOption: { value: 'magazine', label: '杂志布局', icon: '📰' }
  },
  {
    id: 'layout-timeline',
    name: '时间轴布局',
    description: '竖向时间轴，适合年代历史展示',
    version: '1.0.0', author: 'Community', tags: ['时间轴', '历史'],
    thumbnail: '',
    slotDefinitions: [
      { name: 'timeline', label: '时间轴内容' }
    ],
    layoutOption: { value: 'timeline', label: '时间轴', icon: '📅' }
  },
  {
    id: 'layout-spotlight',
    name: '聚焦布局',
    description: '中心大图聚焦，上下各一内容区',
    version: '1.0.0', author: 'Community', tags: ['聚焦'],
    thumbnail: '',
    slotDefinitions: [
      { name: 'top', label: '顶部区' },
      { name: 'spotlight', label: '聚焦区', maxBlocks: 1 },
      { name: 'bottom', label: '底部区' }
    ],
    layoutOption: { value: 'spotlight', label: '聚焦', icon: '🎯' }
  }
]
