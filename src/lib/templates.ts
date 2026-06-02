import { Template, FormData } from './types'

// Load template from JSON
export function loadTemplate(id: string): Template {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const template = require(`@/data/templates/${id}.json`)
  return template as Template
}

// Load all templates summary
export function loadTemplatesSummary() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const summary = require('@/data/summary.json')
  return summary
}

// Load config
export function loadConfig() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('@/data/config.json')
  return config
}
