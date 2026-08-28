import type { TermRow } from '../types'
import { parseTermText } from './terms'

type TermRecord = Record<string, unknown>

const SOURCE_KEYS = [
  'source',
  'zh',
  '中文',
  '源',
  '源语言',
  'src',
  'chinese',
  'cn',
  'term',
  'word',
  'key',
  'label',
  '原文',
]

const TARGET_KEYS = [
  'target',
  'en',
  '英文',
  '目标',
  '目标语言',
  'dst',
  'english',
  'translation',
  'value',
  'meaning',
  '译文',
  'description',
]

function cleanCell(value: unknown) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function rowFromObject(item: TermRecord): TermRow | null {
  const sourceKey = SOURCE_KEYS.find((key) => Object.prototype.hasOwnProperty.call(item, key))
  const targetKey = TARGET_KEYS.find((key) => Object.prototype.hasOwnProperty.call(item, key))
  if (!sourceKey || !targetKey) return null

  const source = cleanCell(item[sourceKey])
  const target = cleanCell(item[targetKey])
  if (!source || !target) return null

  return { source, target }
}

function normalizeArray(items: unknown[]): TermRow[] {
  return items.flatMap((item): TermRow[] => {
    if (Array.isArray(item)) {
      const source = cleanCell(item[0])
      const target = cleanCell(item[1])
      if (!source || !target) return []
      return [{ source, target }]
    }

    if (item && typeof item === 'object') {
      const row = rowFromObject(item as TermRecord)
      return row ? [row] : []
    }

    return []
  })
}

function normalizeRoot(data: unknown): TermRow[] {
  if (Array.isArray(data)) return normalizeArray(data)
  if (data && typeof data === 'object') {
    const root = data as TermRecord & { rows?: unknown; terms?: unknown; data?: unknown }
    if (Array.isArray(root.rows)) return normalizeArray(root.rows)
    if (Array.isArray(root.terms)) return normalizeArray(root.terms)
    if (Array.isArray(root.data)) return normalizeArray(root.data)

    const single = rowFromObject(data as TermRecord)
    return single ? [single] : []
  }
  return []
}

export function parseStoredRows(rows: unknown): TermRow[] {
  return normalizeRoot(rows)
}

export function parseJsonTerms(text: string): TermRow[] {
  try {
    return normalizeRoot(JSON.parse(text) as unknown)
  } catch {
    return []
  }
}

function initHeader(header: string[]) {
  const source = ['source', 'src', '源', '原文', '中文', 'zh', 'chinese', 'term', 'word', 'key', 'label']
  const target = ['target', 'dst', '译文', '英文', 'en', 'english', 'translation', 'value', 'meaning']

  const lower = header.map((cell) => cell.toLowerCase())
  const sourceIndex = lower.findIndex((cell) => source.some((name) => cell.includes(name)))
  const targetIndex = lower.findIndex((cell) => target.some((name) => cell.includes(name)))

  if (sourceIndex >= 0 || targetIndex >= 0) {
    let column1 = sourceIndex >= 0 ? sourceIndex : 0
    let column2 = targetIndex >= 0 ? targetIndex : 1
    if (column1 === column2) {
      if (column1 === 0) column2 = 1
      else column1 = 1
    }
    return {
      hasHeader: true,
      source: column1,
      target: column2,
    }
  }

  return { hasHeader: false, source: 0, target: 1 }
}

function normalizeMatrix(matrix: unknown[][]) {
  const header = (matrix[0] || []).map((cell) => cleanCell(cell))
  const indexes = initHeader(header)
  const data = (indexes.hasHeader ? matrix.slice(1) : matrix).map((row) =>
    row.map((cell) => cleanCell(cell)),
  )

  return data.flatMap((row) => {
    const source = row[indexes.source] ?? row[0] ?? ''
    const target = row[indexes.target] ?? row[1] ?? ''
    if (!source && !target) return []
    return [{ source, target }]
  })
}

export function parseMarkdownTerms(text: string): TermRow[] {
  const lines = text.split(/\r?\n/)
  const pipeRows = lines
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && line.replace(/\|/g, '').trim() !== '')

  if (pipeRows.length === 0) return parseTermText(text)

  const table = pipeRows.map((line) =>
    line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim()),
  )

  const indexes = initHeader(table[0] || [])
  const isSeparator = (row: string[]) => row.every((cell) => /^:?-{1,}:?$/.test(cell))
  const dataRows = table
    .slice(1)
    .filter((row) => row.length > 1 && !isSeparator(row))

  const markdownRows = dataRows.flatMap((row) => {
    const source = row[indexes.source] ?? row[0] ?? ''
    const target = row[indexes.target] ?? row[1] ?? ''
    if (!source && !target) return []
    return [{ source, target }]
  })

  if (markdownRows.length > 0) return markdownRows
  return parseTermText(text)
}

async function parseXlsxTerms(file: File): Promise<TermRow[]> {
  const buffer = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][]

  return normalizeMatrix(matrix)
}

export function detectUploadFormat(file: File) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx'
  if (name.endsWith('.json') || name.endsWith('.jsonl')) return 'json'
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown'
  return 'csv'
}

export async function parseUploadedTermFile(file: File): Promise<TermRow[]> {
  const format = detectUploadFormat(file)
  if (format === 'xlsx') return parseXlsxTerms(file)

  const text = await file.text()
  const normalizedText = text.replace(/^\uFEFF/, '')
  if (format === 'json') return parseJsonTerms(normalizedText)
  if (format === 'markdown') return parseMarkdownTerms(normalizedText)
  return parseTermText(normalizedText)
}
