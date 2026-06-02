import { loadConfig } from './templates'
import { Template, FormData } from './types'

interface GenerateOptions {
  timeout?: number
  retries?: number
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const config = loadConfig().llm
  const apiKey = process.env.MINIMAX_API_KEY || config.apiKey
  const url = `${config.baseUrl}/v1/messages`

  const body = {
    model: config.model,
    max_tokens: config.maxTokens,
    temperature: config.temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }

  const maxRetries = options.retries ?? 2
  const timeoutMs = options.timeout ?? 300000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!response.ok) {
        const errorText = await response.text()
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          const wait = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise((r) => setTimeout(r, wait))
          continue
        }
        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        return data.content.map((block: { text?: string }) => block.text || '').join('')
      }

      throw new Error(`Unexpected API response`)
    } catch (err) {
      clearTimeout(timer)
      const error = err as Error
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) continue
        throw new Error(`Request timed out after ${timeoutMs}ms`)
      }
      if (attempt < maxRetries && error.message.includes('fetch')) {
        const wait = Math.min(1000 * Math.pow(2, attempt), 10000)
        await new Promise((r) => setTimeout(r, wait))
        continue
      }
      throw err
    }
  }

  throw new Error('Max retries exceeded')
}

export async function generateTemplateFields(
  template: Template,
  userInput: FormData
): Promise<FormData> {
  const aiFields = template.fields.filter((f) => f.aiGenerated)

  if (aiFields.length === 0) {
    return {}
  }

  const contextLines = Object.entries(userInput).map(([key, value]) => {
    const field = template.fields.find((f) => f.key === key)
    const label = field ? field.label : key
    return `${label}：${value}`
  })

  const fieldsToGenerate = aiFields.map((f) => {
    let desc = `- ${f.key}：${f.label}`
    if (f.aiHint) desc += `（${f.aiHint}）`
    return desc
  })

  const userPrompt = `请根据以下课程信息，生成文档的各项内容：

【基本信息】
${contextLines.join('\n')}

【需要生成的内容】
${fieldsToGenerate.join('\n')}

请按以下JSON格式输出（保持字段key不变，值为生成的文本内容）：
${JSON.stringify(
  Object.fromEntries(aiFields.map((f) => [f.key, `（此处填写${f.label}的内容）`])),
  null,
  2
)}

注意：直接输出JSON，不要添加markdown代码块标记。`

  const response = await generateContent(template.aiSystemPrompt, userPrompt, {
    timeout: 300000,
  })

  let cleaned = response.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) cleaned = jsonMatch[0]

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`AI response is not valid JSON`)
  }
}
