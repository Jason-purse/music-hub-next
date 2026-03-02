'use client'
/**
 * PluginWCHost — 安全挂载 Web Component 的 Client Component
 *
 * 安全原则：
 * 1. tagName 必须通过正则校验（自定义元素名规范：含连字符）
 * 2. script 只从内部 /api/plugins/[id]/script 加载
 * 3. 全程 DOM API，零 innerHTML / dangerouslySetInnerHTML
 * 4. 属性通过 setAttribute 设置，不拼接 HTML 字符串
 */
import { useEffect, useRef } from 'react'

// 自定义元素名规范：小写字母开头，包含至少一个连字符
const VALID_CUSTOM_ELEMENT = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/

// 只允许内部 API 路径
const VALID_SCRIPT_URL = /^\/api\/plugins\/[a-z0-9_-]+\/script$/

// 只允许安全的 attribute 名（纯小写字母+连字符）
const VALID_ATTR_NAME = /^[a-z][a-z0-9-]*$/

interface Props {
  pluginId: string
  tagName: string
  scriptUrl: string | null
  config?: Record<string, unknown>
  attrs?: Record<string, string>
}

export function PluginWCHost({ pluginId, tagName, scriptUrl, config, attrs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 服务端已校验，这里做客户端二次校验
  const tagValid = VALID_CUSTOM_ELEMENT.test(tagName)
  const scriptValid = !scriptUrl || VALID_SCRIPT_URL.test(scriptUrl)

  useEffect(() => {
    if (!tagValid || !scriptValid) return
    if (!containerRef.current) return

    const container = containerRef.current

    // 懒加载 script（同一插件脚本只加载一次）
    const scriptKey = `data-plugin-script-${pluginId}`
    if (scriptUrl && !document.querySelector(`[${scriptKey}]`)) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = scriptUrl
      script.setAttribute(scriptKey, '')
      script.defer = true
      document.head.appendChild(script)
    }

    // 用 DOM API 安全创建自定义元素
    const el = document.createElement(tagName)

    // 传入配置（JSON 序列化，通过 setAttribute 设置）
    if (config && Object.keys(config).length > 0) {
      el.setAttribute('plugin-config', JSON.stringify(config))
    }

    // 传入额外 props（名称校验后才设置）
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (VALID_ATTR_NAME.test(k)) {
          el.setAttribute(k, String(v))
        }
      }
    }

    container.appendChild(el)

    return () => {
      if (container.contains(el)) container.removeChild(el)
    }
  }, [pluginId, tagName, scriptUrl, tagValid, scriptValid])

  if (!tagValid || !scriptValid) {
    // 安全：校验失败时什么都不渲染（不报错，不泄露信息）
    console.warn(`[PluginWCHost] 拒绝渲染插件 ${pluginId}：校验未通过`)
    return null
  }

  return (
    <div
      ref={containerRef}
      data-plugin-host={pluginId}
      data-plugin-component={tagName}
    />
  )
}
