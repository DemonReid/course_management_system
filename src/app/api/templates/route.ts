import { NextResponse } from 'next/server'
import { loadTemplatesSummary } from '@/lib/templates'

export async function GET() {
  try {
    const summary = loadTemplatesSummary()
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}
