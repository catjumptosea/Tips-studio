import type { TermMatch, TermRow, TermTable } from '../types'

export type UploadedTermFile = {
  id: string
  label: string
  enabled: boolean
  format?: string
  text?: string
  rows?: TermRow[]
}

export type TermLibraryPrefs = {
  disabled: string[]
  deleted: string[]
  uploaded: UploadedTermFile[]
}

const TERM_PREFS_KEY = 'tips-studio:term-library'

export const BUILTIN_TERM_FILES = [
  { id: 'cws', label: 'cws_zh-CN' },
  { id: 'aui', label: 'AUI-Continuous_zh-CN' },
  { id: 'phantom', label: 'PhantomPDF-Continuous_zh-CN' },
]

type BuiltinImporter = () => Promise<string>

const BUILTIN_RAW_IMPORTERS: Record<string, BuiltinImporter> = {
  cws: () => import('../assets/tm/cws_zh-CN.csv?raw').then((module) => module.default),
  aui: () => import('../assets/tm/AUI-Continuous_zh-CN.csv?raw').then((module) => module.default),
  phantom: () =>
    import('../assets/tm/PhantomPDF-Continuous_zh-CN.csv?raw').then((module) => module.default),
}

const builtinRowsPromiseCache = new Map<string, Promise<TermRow[]>>()

function getBuiltinRows(id: string): Promise<TermRow[]> {
  const cached = builtinRowsPromiseCache.get(id)
  if (cached) return cached

  const promise = BUILTIN_RAW_IMPORTERS[id]()
    .then((text) => parseTermText(text))
    .catch(() => [])
  builtinRowsPromiseCache.set(id, promise)
  return promise
}

export async function loadBuiltinTermTables(deleted: string[], disabled: string[]): Promise<TermTable[]> {
  const included = BUILTIN_TERM_FILES.filter((item) => !deleted.includes(item.id))
  return Promise.all(
    included.map(async (item) => ({
      id: item.id,
      label: item.label,
      enabled: !disabled.includes(item.id),
      builtin: true,
      rows: await getBuiltinRows(item.id),
    })),
  )
}

export function loadTermLibraryPrefs(): TermLibraryPrefs {
  try {
    const raw = localStorage.getItem(TERM_PREFS_KEY)
    if (!raw) return { disabled: [], deleted: [], uploaded: [] }
    const parsed = JSON.parse(raw) as Partial<TermLibraryPrefs>
    return {
      disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [],
      deleted: Array.isArray(parsed.deleted) ? parsed.deleted : [],
      uploaded: Array.isArray(parsed.uploaded) ? parsed.uploaded : [],
    }
  } catch {
    return { disabled: [], deleted: [], uploaded: [] }
  }
}

export function saveTermLibraryPrefs(prefs: TermLibraryPrefs) {
  localStorage.setItem(TERM_PREFS_KEY, JSON.stringify(prefs))
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function detectDelimiter(line: string) {
  if (line.includes('\t')) return '\t'
  if (line.includes(';')) return ';'
  return ','
}

function cleanCell(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function parseTermText(text: string): TermRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const delimiter = detectDelimiter(lines[0])
  const rows: TermRow[] = []

  lines.forEach((line) => {
    const cells = splitCsvLine(line, delimiter)
    if (cells.length < 2) return
    if (cells.some((cell) => /PSLCODE|Source Access Key|Target Access Key/i.test(cell))) return

    const source = cleanCell(cells[1] ?? cells[cells.length - 2] ?? '')
    const target = cleanCell(cells[2] ?? cells[cells.length - 1] ?? '')
    if (source || target) {
      rows.push({ source, target })
    }
  })

  return rows
}

function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,!?;:，。！？；：'"“”‘’()（）[\]·/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type NormalizedTerm = {
  norm: string
}

type TermCacheItem = {
  row: TermRow
  source: NormalizedTerm
  target: NormalizedTerm
}

const termCacheByRows = new WeakMap<TermRow[], TermCacheItem[]>()

function buildNormalizedTerm(value: string): NormalizedTerm {
  return { norm: normalizeTerm(value) }
}

function getTermCache(rows: TermRow[]): TermCacheItem[] {
  const cached = termCacheByRows.get(rows)
  if (cached) return cached

  const items = rows.map((row) => ({
    row,
    source: buildNormalizedTerm(row.source),
    target: buildNormalizedTerm(row.target),
  }))
  termCacheByRows.set(rows, items)
  return items
}

export async function searchTerms(
  tables: TermTable[],
  zh: string,
  en: string,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<TermMatch[]> {
  const enabledTables = tables.filter((table) => table.enabled)
  if (enabledTables.length === 0) return []

  const matches: TermMatch[] = []
  const zhTerm = buildNormalizedTerm(zh)
  const enTerm = buildNormalizedTerm(en)
  const total = enabledTables.reduce(
    (sum, table) => sum + getTermCache(table.rows).length,
    0,
  )
  let processed = 0

  for (const table of enabledTables) {
    for (const item of getTermCache(table.rows)) {
      if (signal?.aborted) return []

      const sourceNorm = item.source.norm
      const targetNorm = item.target.norm
      const containsZh =
        zhTerm.norm !== '' &&
        (sourceNorm.includes(zhTerm.norm) || targetNorm.includes(zhTerm.norm))
      const containsEn =
        enTerm.norm !== '' &&
        (sourceNorm.includes(enTerm.norm) || targetNorm.includes(enTerm.norm))

      if (containsZh || containsEn) {
        let bestScore = 0
        const considerScore = (queryLength: number, targetLength: number) => {
          if (!targetLength) return
          const score = Math.min(100, Math.round((queryLength / targetLength) * 100))
          if (score > bestScore) bestScore = score
        }

        if (zhTerm.norm !== '' && sourceNorm.includes(zhTerm.norm)) {
          considerScore(zhTerm.norm.length, sourceNorm.length)
        }
        if (zhTerm.norm !== '' && targetNorm.includes(zhTerm.norm)) {
          considerScore(zhTerm.norm.length, targetNorm.length)
        }
        if (enTerm.norm !== '' && sourceNorm.includes(enTerm.norm)) {
          considerScore(enTerm.norm.length, sourceNorm.length)
        }
        if (enTerm.norm !== '' && targetNorm.includes(enTerm.norm)) {
          considerScore(enTerm.norm.length, targetNorm.length)
        }

        matches.push({
          table: table.label,
          source: item.row.source,
          target: item.row.target,
          score: bestScore,
        })
      }

      processed += 1
      if (processed % 100 === 0) {
        onProgress?.(processed, total)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }
    onProgress?.(processed, total)
  }

  onProgress?.(total, total)
  return matches.sort((a, b) => b.score - a.score)
}
