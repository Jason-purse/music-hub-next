'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  placeholder: string
  tags: string
}

export function SearchBarComponent({ props }: { props: SearchBarProps }) {
  const { placeholder = '搜索歌曲、歌手…', tags = '' } = props
  const [query, setQuery] = useState('')
  const router = useRouter()

  const tagList = tags
    ? tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  function handleSearch(q: string) {
    if (!q.trim()) return
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 shadow-sm dark:shadow-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />
        <button
          onClick={() => handleSearch(query)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-medium transition shadow-sm"
        >
          搜索
        </button>
      </div>
      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tagList.map(tag => (
            <button
              key={tag}
              onClick={() => handleSearch(tag)}
              className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
