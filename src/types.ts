export type PromptCategory = {
  id: string
  label: string
  short: string
  description: string
  purpose: string
  component: string
  duration?: string
  rules: string[]
  examples: string[]
  modes?: string[]
}

export type ToneOption = {
  id: string
  label: string
  short: string
  description: string
  characteristics: string
  cases: string
  requirements: string[]
  examples: string[]
}

export type ProviderConfig = {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export type GenerateInput = {
  category: PromptCategory
  tone: ToneOption
  scene: string
  useSceneAsChinese: boolean
  useReference: boolean
  referenceText: string
  modes?: string[]
  followUp?: string
  currentResult?: GeneratedPrompt
  config: ProviderConfig
}

export type PromptLengthResult = {
  mode: string
  zh: string
  en: string
}

export type GeneratedPrompt = {
  zh: string
  en: string
  component: string
  duration?: string
  tone: string
  category: string
  raw: string
  results?: PromptLengthResult[]
  other?: string
}

export type TermRow = {
  source: string
  target: string
}

export type TermTable = {
  id: string
  label: string
  enabled: boolean
  builtin: boolean
  rows: TermRow[]
}

export type TermMatch = {
  table: string
  source: string
  target: string
  score: number
}

export type HistoryItem = {
  id: string
  createdAt: string
  categoryLabel: string
  toneLabel: string
  scene: string
  useSceneAsChinese?: boolean
  useReference: boolean
  referenceText: string
  modes?: string[]
  result: GeneratedPrompt
}
