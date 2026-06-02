'use client'

import { useState, useEffect } from 'react'
import { Template } from '@/lib/types'

interface TemplateGridProps {
  onSelectTemplate: (template: Template) => void
}

export default function TemplateGrid({ onSelectTemplate }: TemplateGridProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
  }, [])

  const filteredTemplates = templates.filter((t) => {
    if (filter !== 'all' && t.priority !== filter) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const priorityColors: Record<string, string> = {
    P0: 'bg-red-100 text-red-800',
    P1: 'bg-orange-100 text-orange-800',
    P2: 'bg-blue-100 text-blue-800',
    P3: 'bg-gray-100 text-gray-800',
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="搜索模板..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">全部优先级</option>
          <option value="P0">P0 - 核心</option>
          <option value="P1">P1 - 重要</option>
          <option value="P2">P2 - 辅助</option>
          <option value="P3">P3 - 低自动化</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="card hover:shadow-md transition-shadow cursor-pointer group"
            onClick={async () => {
              try {
                const response = await fetch(`/api/templates/${t.id}`)
                const fullTemplate = await response.json()
                onSelectTemplate(fullTemplate)
              } catch (error) {
                console.error('Failed to load template:', error)
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold text-primary-900 group-hover:text-gold-600 transition-colors">
                {t.name}
              </h3>
              <span className={`text-xs font-medium px-2 py-1 rounded ${priorityColors[t.priority]}`}>
                {t.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">分类:</span>
                <span>{t.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">字段:</span>
                <span>{t.fieldCount} 个</span>
              </div>
              {t.aiFieldCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">AI 生成:</span>
                  <span className="text-gold-600 font-medium">{t.aiFieldCount} 个</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">检查阶段:</span>
                <span>{t.checkPhase.join(', ')}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  t.aiAutomationLevel === 'high' ? 'bg-green-500' :
                  t.aiAutomationLevel === 'medium' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {t.aiAutomationLevel === 'high' ? '高自动化' :
                   t.aiAutomationLevel === 'medium' ? '中等自动化' :
                   t.aiAutomationLevel === 'low' ? '低自动化' : '仅参考'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          没有找到匹配的模板
        </div>
      )}
    </div>
  )
}
