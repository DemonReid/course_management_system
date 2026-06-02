export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'longtext' | 'select' | 'number'
  required: boolean
  aiGenerated?: boolean
  aiHint?: string
  placeholder?: string
  defaultValue?: string
  autoFill?: string
  options?: string[]
  rows?: number
}

export interface TemplateSection {
  title: string
  fields: string[]
}

export interface Template {
  id: string
  name: string
  description: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: string
  checkPhase: string[]
  aiAutomationLevel: 'high' | 'medium' | 'low' | 'reference'
  estimatedTokens?: number
  fields: TemplateField[]
  sections: TemplateSection[]
  aiSystemPrompt: string
  sampleData?: Record<string, string>
}

export interface FormData {
  [key: string]: string
}

export interface GenerationResult {
  templateId: string
  templateName: string
  generatedAt: string
  formData: FormData
  aiFields: FormData
  allFields: FormData
}
