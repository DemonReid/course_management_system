'use client'

import { useState } from 'react'
import { Template, FormData } from '@/lib/types'
import { exportToWord } from '@/lib/export'
import UploadModal from './UploadModal'

interface GenerateFormProps {
  template: Template
  onBack: () => void
}

export default function GenerateForm({ template, onBack }: GenerateFormProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'review'>('input')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [formData, setFormData] = useState<FormData>(() => {
    // Pre-fill default values
    const defaults: FormData = {}
    template.fields.forEach((f) => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue
      if (f.autoFill === 'currentSemester') defaults[f.key] = '2025-2026学年第2学期'
      if (f.autoFill === 'currentUser') defaults[f.key] = '彭芳'
    })
    return defaults
  })
  const [aiFields, setAiFields] = useState<FormData>({})
  const [error, setError] = useState<string | null>(null)

  // Separate user-input fields from AI-generated fields
  const userInputFields = template.fields.filter((f) => !f.aiGenerated)
  const aiGenFields = template.fields.filter((f) => f.aiGenerated)

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGenerate = async () => {
    setStep('generating')
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          userInput: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '生成失败，请重试')
      }

      setAiFields(data.aiFields)
      setStep('review')
    } catch (err) {
      setError((err as Error).message)
      setStep('input')
    }
  }

  const handleExport = async () => {
    try {
      const allFields = { ...formData, ...aiFields }
      await exportToWord(template, allFields)
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请重试')
    }
  }

  if (step === 'generating') {
    return (
      <div className="card text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-900 border-t-transparent mb-4"></div>
        <h2 className="text-xl font-serif text-primary-900 mb-2">AI 正在生成文档...</h2>
        <p className="text-gray-600">请稍候，通常需要 30-60 秒</p>
      </div>
    )
  }

  if (step === 'review') {
    const allFields = { ...formData, ...aiFields }

    const handleFieldEdit = (key: string, value: string) => {
      setAiFields((prev) => ({ ...prev, [key]: value }))
    }

    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-serif text-primary-900">{template.name}</h2>
              <p className="text-sm text-gray-500 mt-1">AI 生成的内容可直接编辑修改</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('input')} className="btn-secondary text-sm px-4 py-2">
                ← 返回修改
              </button>
              <button onClick={handleExport} className="btn-gold text-sm px-4 py-2">
                导出 Word
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {template.sections.map((section, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6 last:border-0">
                <h3 className="text-lg font-semibold text-primary-800 mb-4 border-l-4 border-gold-500 pl-3">
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((fieldKey) => {
                    const field = template.fields.find((f) => f.key === fieldKey)
                    if (!field) return null
                    const value = allFields[fieldKey] || ''
                    const isAI = field.aiGenerated

                    return (
                      <div key={fieldKey}>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          {field.label}
                          {isAI && (
                            <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded">
                              AI 生成 · 可编辑
                            </span>
                          )}
                        </label>
                        {isAI ? (
                          <textarea
                            value={value}
                            onChange={(e) => handleFieldEdit(fieldKey, e.target.value)}
                            className="input-field text-sm"
                            rows={Math.max(4, (value.split('\n').length + 1))}
                          />
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg text-gray-900">
                            {value || <span className="text-gray-400">（未填写）</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3 justify-end">
            <button onClick={handleExport} className="btn-secondary">
              导出 Word 文档
            </button>
            <button onClick={() => setShowUploadModal(true)} className="btn-gold">
              上传到系统
            </button>
          </div>
        </div>

        {showUploadModal && (
          <UploadModal
            template={template}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={() => {
              alert('文档上传成功！可在"系统现有文档"中查看')
            }}
          />
        )}
      </div>
    )
  }

  // Input step
  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
            ← 返回
          </button>
          <h2 className="text-2xl font-serif text-primary-900">{template.name}</h2>
        </div>

        <p className="text-gray-600 mb-6">{template.description}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {userInputFields.map((field) => (
            <div key={field.key}>
              <label className="label">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'select' && field.options ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="input-field"
                  required={field.required}
                >
                  <option value="">{field.placeholder || '请选择'}</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'longtext' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows || 4}
                  className="input-field"
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="input-field"
                  required={field.required}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {aiGenFields.length > 0 && (
                <span>
                  AI 将自动生成 <strong className="text-gold-600">{aiGenFields.length}</strong> 个字段
                </span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={userInputFields.some((f) => f.required && !formData[f.key])}
              className="btn-primary"
            >
              生成文档
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
