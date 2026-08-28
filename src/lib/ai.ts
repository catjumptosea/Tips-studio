import type { GenerateInput, GeneratedPrompt, PromptLengthResult, ProviderConfig } from '../types'

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '')
}

function buildSystemPrompt(input: GenerateInput) {
  const category = input.category
  return [
    '你是一名资深产品文案专家，专长是编写软件界面和交互中的中英文双语提示词。',
    '输出必须是紧凑、可直接使用的产品文案，不解释、不追加段落。',
    input.modes?.length
      ? '始终返回以下 JSON 结构：{"zh":"默认中文提示词","en":"默认英文提示词","component":"适用组件","results":[{"mode":"输出长度名称","zh":"对应中文提示词","en":"对应英文提示词"}],"other":"其他建议、备选文案或说明"}'
      : '始终返回以下 JSON 结构：{"zh":"默认中文提示词","en":"默认英文提示词","component":"适用组件"}',
    input.modes?.length ? `输出长度要求（可多选）：${input.modes.join('、')}` : '',
    input.modes?.length
      ? '当指定了输出长度时，请在 results 中按每个长度返回对应文案，其他补充内容放入 other 字段。'
      : '未选择输出长度时，不要返回 results 字段，也不要返回 mode 字段。',
    input.followUp
      ? '你正在对上一轮生成结果进行追问调整。请结合当前已生成结果，严格按照追加要求重新生成完整输出。'
      : '',
    `提示词类型：${category.label}`,
    `适用组件：${category.component}`,
    `写作规则：${category.rules.join('；')}`,
    `语气风格：${input.tone.label}。${input.tone.characteristics}`,
    input.tone.cases ? `语气适用场景：${input.tone.cases}` : '',
    input.tone.requirements.length ? `语气写作要求：${input.tone.requirements.join('；')}` : '',
    input.tone.examples.length ? `语气示例：${input.tone.examples.join('；')}` : '',
    category.examples.length ? `类型示例：${category.examples.join('；')}` : '',
    input.useReference && input.referenceText.trim()
      ? `参考词条/已有文案：\n${input.referenceText.trim()}`
      : '',
    input.scene.trim() ? `补充场景：\n${input.scene.trim()}` : '',
    input.useSceneAsChinese
      ? '「直接作为中文词条」已开启：补充场景中的内容必须原样作为中文词条 zh，不得改写；AI 只负责生成对应的英文 en。'
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildUserPrompt(input: GenerateInput) {
  const scene = input.scene.trim() || '请基于当前的类型和语气设计一句自然的产品提示词。'
  const base = input.useSceneAsChinese
    ? `请为以下中文词条生成对应的英文提示词，中文词条保持原样：\n${scene}`
    : `让我生成一组「${input.category.label}」提示词，语气采用「${input.tone.label}」。\n场景：${scene}`
  if (!input.followUp) return base

  const currentResult = input.currentResult
    ? `当前已生成结果：\nzh: ${input.currentResult.zh}\nen: ${input.currentResult.en}`
    : ''
  return [base, currentResult, `追加调整要求：${input.followUp}`, '请基于以上内容和当前提示词类型、语气、输出长度要求，重新生成完整的中英文结果。']
    .filter(Boolean)
    .join('\n')
}

export async function testConnection(config: ProviderConfig) {
  const response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 4,
      temperature: 0,
    }),
  })
  if (!response.ok) {
    throw new Error(`连接失败：HTTP ${response.status}`)
  }
  return response.json()
}

export async function generatePrompt(input: GenerateInput): Promise<GeneratedPrompt> {
  const response = await fetch(`${normalizeBaseUrl(input.config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(input.config.apiKey ? { Authorization: `Bearer ${input.config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: input.config.model,
      messages: [
        { role: 'system', content: buildSystemPrompt(input) },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`生成失败：HTTP ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const cleaned = content.replace(/```json|```/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    const overrideZh = input.useSceneAsChinese ? input.scene.trim() : null
    return {
      zh: overrideZh ?? parsed.zh ?? '',
      en: parsed.en ?? '',
      component: parsed.component ?? input.category.component,
      tone: input.tone.label,
      category: input.category.label,
      raw: cleaned,
      results: Array.isArray(parsed.results)
        ? parsed.results
            .map(
              (item: { mode?: string; zh?: string; en?: string }) =>
                item && typeof item.zh === 'string' && typeof item.en === 'string'
                  ? {
                      mode: item.mode ?? input.modes?.[0] ?? '',
                      zh: overrideZh ?? item.zh,
                      en: item.en,
                    }
                  : null,
            )
            .filter((item: PromptLengthResult | null): item is PromptLengthResult => item !== null)
        : undefined,
      other: typeof parsed.other === 'string' ? parsed.other : undefined,
    }
  } catch {
    return {
      zh: input.useSceneAsChinese ? input.scene.trim() : cleaned,
      en: cleaned,
      component: input.category.component,
      tone: input.tone.label,
      category: input.category.label,
      raw: cleaned,
    }
  }
}
