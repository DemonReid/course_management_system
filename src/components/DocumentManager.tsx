'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getFilteredDocuments,
  deleteDocument,
  type StoredDocument,
} from '@/lib/client-storage'

export default function DocumentManager() {
  const { user, isAdmin } = useAuth()
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [grouped, setGrouped] = useState<Record<string, StoredDocument[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = () => {
    try {
      if (!user) return
      const result = getFilteredDocuments(user.id, user.role)
      setDocuments(result.documents)
      setGrouped(result.grouped)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (docId: string) => {
    if (!confirm('确定要删除此文档吗？')) return

    try {
      deleteDocument(docId)
      fetchDocuments()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('删除失败')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-900 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-primary-900">系统现有文档</h2>
        <span className="text-sm text-gray-600">
          共 {documents.length} 个文档
        </span>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">暂无文档</p>
          <p className="text-sm text-gray-400 mt-2">
            {isAdmin ? '系统中还没有上传的文档' : '您还没有上传过文档'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([teacherName, docs]) => (
            <div key={teacherName} className="card">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-900 font-semibold">
                    {teacherName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">{teacherName}</h3>
                  <p className="text-sm text-gray-500">{docs.length} 个文档</p>
                </div>
              </div>

              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {doc.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatDate(doc.uploadDate)}</span>
                        <span>{formatSize(doc.size)}</span>
                      </div>
                    </div>

                    {(isAdmin || doc.uploaderName === user?.name) && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
