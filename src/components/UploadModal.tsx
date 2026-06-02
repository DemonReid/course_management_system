'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Template } from '@/lib/types'
import { uploadDocument } from '@/lib/client-storage'

interface UploadModalProps {
  template: Template
  onClose: () => void
  onUploadSuccess: () => void
}

export default function UploadModal({ template, onClose, onUploadSuccess }: UploadModalProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setError('')

    try {
      await uploadDocument(file, template.name, user.id, user.name)
      onUploadSuccess()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif text-primary-900">上传文档</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">模板类型</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-900">
              {template.name}
            </div>
          </div>

          <div>
            <label className="label">选择文件</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".docx,.doc,.pdf"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              支持 .docx, .doc, .pdf 格式
            </p>
          </div>

          {file && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>上传后文件名：</strong>
              </p>
              <p className="text-sm text-blue-800 mt-1 font-mono">
                {user?.name}_{file.name.replace(/\.[^/.]+$/, '')}（{template.name}）
                {file.name.match(/\.[^/.]+$/)?.[0]}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={uploading}>
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary flex-1"
            >
              {uploading ? '上传中...' : '上传'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
