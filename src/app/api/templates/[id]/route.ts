import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const template = require(`@/data/templates/${templateId}.json`)

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error loading template:', error)
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    )
  }
}
