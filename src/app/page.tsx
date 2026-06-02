'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/components/LoginPage'
import RegisterPage from '@/components/RegisterPage'
import TemplateGrid from '@/components/TemplateGrid'
import GenerateForm from '@/components/GenerateForm'
import DocumentManager from '@/components/DocumentManager'
import AdminPanel from '@/components/AdminPanel'
import { Template } from '@/lib/types'

type View = 'dashboard' | 'generate' | 'documents' | 'admin'
type AuthView = 'login' | 'register'

export default function Home() {
  const { user, logout, isAdmin } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [authView, setAuthView] = useState<AuthView>('login')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Show auth pages if not authenticated
  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />
  }

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setView('generate')
  }

  const handleBack = () => {
    setView('dashboard')
    setSelectedTemplate(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold">
                贵州中医药大学预防医学教研室
              </h1>
              <p className="text-primary-200 text-sm mt-1">文档管理系统</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-primary-200 text-sm">
                  {user.name}
                  {user.role === 'admin' && (
                    <span className="ml-1 text-xs bg-gold-500 text-primary-900 px-2 py-0.5 rounded">
                      管理员
                    </span>
                  )}
                </span>
                <button
                  onClick={logout}
                  className="text-primary-200 hover:text-white text-sm underline"
                >
                  退出
                </button>
              </div>
              <div className="hidden sm:block">
                <div className="bg-gold-500 text-primary-900 px-4 py-2 rounded-lg font-medium text-sm">
                  Септик формализма
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1 mt-6 -mb-6">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                view === 'dashboard' || view === 'generate'
                  ? 'bg-gray-50 text-primary-900'
                  : 'text-primary-200 hover:text-white hover:bg-primary-800'
              }`}
            >
              生成文档
            </button>
            <button
              onClick={() => setView('documents')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                view === 'documents'
                  ? 'bg-gray-50 text-primary-900'
                  : 'text-primary-200 hover:text-white hover:bg-primary-800'
              }`}
            >
              系统现有文档
            </button>
            {isAdmin && (
              <button
                onClick={() => setView('admin')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  view === 'admin'
                    ? 'bg-gray-50 text-primary-900'
                    : 'text-primary-200 hover:text-white hover:bg-primary-800'
                }`}
              >
                用户管理
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'dashboard' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-serif text-primary-900 mb-2">选择文档模板</h2>
              <p className="text-gray-600">
                选择一个模板，填写基本信息，AI 将自动生成完整的文档内容
              </p>
            </div>
            <TemplateGrid onSelectTemplate={handleSelectTemplate} />
          </div>
        )}

        {view === 'generate' && selectedTemplate && (
          <GenerateForm template={selectedTemplate} onBack={handleBack} />
        )}

        {view === 'documents' && <DocumentManager />}

        {view === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2026 贵州中医药大学预防医学教研室</p>
            <p className="mt-1">教研室文书管理系统 · Powered by MiniMax-M2.7</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
