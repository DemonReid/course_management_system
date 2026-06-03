import { NextRequest, NextResponse } from 'next/server'
import { generateTemplateFields } from '@/lib/ai'
import { loadTemplate } from '@/lib/templates'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const { templateId, userInput } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing templateId' },
        { status: 400 }
      )
    }

    const template = loadTemplate(templateId)
    const aiFields = await generateTemplateFields(template, userInput)

    return NextResponse.json({
      success: true,
      templateId,
      templateName: template.name,
      aiFields,
      allFields: { ...userInput, ...aiFields },
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
