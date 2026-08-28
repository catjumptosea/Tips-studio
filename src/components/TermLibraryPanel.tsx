import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Database, Plus, Search, Table2, Trash2, X } from 'lucide-react'
import type { TermMatch, TermTable } from '../types'
import { detectUploadFormat, parseStoredRows, parseUploadedTermFile } from '../lib/termImporters'
import {
  loadBuiltinTermTables,
  loadTermLibraryPrefs,
  parseTermText,
  saveTermLibraryPrefs,
  searchTerms,
} from '../lib/terms'

export type TermQuery = {
  id: number
  zh: string
  en: string
}

export type TermSearchCache = {
  queryId: number
  matches: TermMatch[] | null
  searching: boolean
  searchProgress: { done: number; total: number } | null
  searchCanceled: boolean
  page: number
}

const PAGE_SIZE = 10

type PageItem = number | 'prev' | 'next'

function getPaginationItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1) as PageItem[]
  }

  const set = new Set<number>([
    1,
    Math.max(1, page - 1),
    page,
    Math.min(totalPages, page + 1),
    totalPages,
  ])
  const items: PageItem[] = []
  let previous = 0

  for (const item of Array.from(set).sort((a, b) => a - b)) {
    if (item - previous > 1) items.push(item <= page ? 'prev' : 'next')
    items.push(item)
    previous = item
  }

  return items
}

function TermPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const [jumpValue, setJumpValue] = useState('')

  if (totalPages <= 1) return null

  const items = getPaginationItems(page, totalPages)
  const clamp = (value: number) => Math.min(Math.max(1, value), totalPages)
  const jumpStep = 5

  return (
    <div className="term-pagination" role="navigation" aria-label="词条分页">
      <button
        type="button"
        className="pagination-button"
        disabled={page <= 1}
        onClick={() => onChange(clamp(page - 1))}
      >
        <ChevronLeft size={15} />
        上一页
      </button>
      <div className="term-pagination-pages">
        {items.map((item, index) => {
          if (item === 'prev') {
            return (
              <button
                type="button"
                className="pagination-ellipsis-button"
                key={`before-${index}`}
                aria-label={`向前 ${jumpStep} 页`}
                disabled={page <= 1}
                onClick={() => onChange(clamp(page - jumpStep))}
              >
                …
              </button>
            )
          }

          if (item === 'next') {
            return (
              <button
                type="button"
                className="pagination-ellipsis-button"
                key={`after-${index}`}
                aria-label={`向后 ${jumpStep} 页`}
                disabled={page >= totalPages}
                onClick={() => onChange(clamp(page + jumpStep))}
              >
                …
              </button>
            )
          }

          return (
            <button
              type="button"
              key={item}
              className={item === page ? 'pagination-page active' : 'pagination-page'}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {item}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="pagination-button"
        disabled={page >= totalPages}
        onClick={() => onChange(clamp(page + 1))}
      >
        下一页
        <ChevronRight size={15} />
      </button>
      <form
        className="pagination-quick"
        role="form"
        aria-label="跳转页码"
        onSubmit={(event) => {
          event.preventDefault()
          const target = Number(jumpValue.trim())
          if (Number.isInteger(target) && target > 0) {
            onChange(clamp(target))
          }
          setJumpValue('')
        }}
      >
        <label className="pagination-quick-label" htmlFor="pagination-jump-input">
          跳至
        </label>
        <input
          id="pagination-jump-input"
          className="pagination-quick-input"
          aria-label="页码"
          inputMode="numeric"
          value={jumpValue}
          onChange={(event) => setJumpValue(event.target.value)}
          placeholder="页"
        />
        <button type="submit" className="pagination-quick-button">
          Go
        </button>
      </form>
    </div>
  )
}

type TermLibraryPanelProps = {
  query?: TermQuery
  onAddReference: (text: string) => void
  cachedSearch?: TermSearchCache
  onTermSearchStateChange?: (cache: TermSearchCache) => void
}

export function TermLibraryPanel({
  query,
  onAddReference,
  cachedSearch,
  onTermSearchStateChange,
}: TermLibraryPanelProps) {
  const [tables, setTables] = useState<TermTable[]>([])
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<TermMatch[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState<{ done: number; total: number } | null>(null)
  const [searchCanceled, setSearchCanceled] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [managerOpen, setManagerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const managerRef = useRef<HTMLDivElement>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const cachedSearchRef = useRef(cachedSearch)
  const hydratedQueryRef = useRef<number | null>(null)
  const prefsRef = useRef(loadTermLibraryPrefs())
  cachedSearchRef.current = cachedSearch

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (managerOpen && managerRef.current && !managerRef.current.contains(event.target as Node)) {
        setManagerOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setManagerOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [managerOpen])

  useEffect(() => {
    let cancelled = false

    async function loadTables() {
      setLoading(true)
      const prefs = prefsRef.current
      const builtinResults = await loadBuiltinTermTables(prefs.deleted, prefs.disabled)

      const uploadedTables = prefs.uploaded
        .map((item) => ({
          id: item.id,
          label: item.label,
          enabled: item.enabled,
          builtin: false,
          rows: Array.isArray(item.rows) ? parseStoredRows(item.rows) : parseTermText(item.text ?? ''),
        }))
        .filter((table) => table.rows.length > 0)

      if (!cancelled) {
        setTables([...builtinResults, ...uploadedTables])
        setLoading(false)
      }
    }

    loadTables()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    searchAbortRef.current?.abort()

    if (loading) {
      setSearching(false)
      setSearchProgress(null)
      setSearchCanceled(false)
      setMatches(null)
      return
    }
    if (!query) {
      setSearching(false)
      setSearchProgress(null)
      setSearchCanceled(false)
      setMatches(null)
      return
    }

    const activeCache = cachedSearchRef.current
    if (activeCache && activeCache.queryId === query.id && hydratedQueryRef.current !== query.id) {
      setSearching(activeCache.searching)
      setSearchProgress(activeCache.searchProgress)
      setSearchCanceled(activeCache.searchCanceled)
      setMatches(activeCache.matches)
      setPage(activeCache.page)
      hydratedQueryRef.current = query.id
      return
    }

    hydratedQueryRef.current = query.id

    const controller = new AbortController()
    searchAbortRef.current = controller
    setSearching(true)
    setSearchProgress({ done: 0, total: 0 })
    setSearchCanceled(false)
    setMatches(null)
    setPage(1)

    searchTerms(
      tables,
      query.zh,
      query.en,
      (done, total) => {
        if (!controller.signal.aborted) setSearchProgress({ done, total })
      },
      controller.signal,
    )
      .then((results) => {
        if (controller.signal.aborted) return
        setMatches(results)
        setPage(1)
        setSearching(false)
        setSearchProgress(null)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setMatches([])
        setPage(1)
        setSearching(false)
        setSearchProgress(null)
      })

    return () => {
      controller.abort()
    }
  }, [query, tables, loading])

  useEffect(() => {
    if (!query || loading) return
    onTermSearchStateChange?.({
      queryId: query.id,
      matches,
      searching,
      searchProgress,
      searchCanceled,
      page,
    })
  }, [query, loading, matches, searching, searchProgress, searchCanceled, page, onTermSearchStateChange])

  function persist(prefs: typeof prefsRef.current) {
    prefsRef.current = prefs
    saveTermLibraryPrefs(prefs)
  }

  function toggleTable(id: string) {
    setTables((current) =>
      current.map((table) => (table.id === id ? { ...table, enabled: !table.enabled } : table)),
    )
    const prefs = prefsRef.current
    const disabled = prefs.disabled.includes(id)
      ? prefs.disabled.filter((item) => item !== id)
      : [...prefs.disabled, id]
    persist({
      ...prefs,
      disabled,
      uploaded: prefs.uploaded.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    })
  }

  function deleteTable(id: string) {
    const table = tables.find((item) => item.id === id)
    setTables((current) => current.filter((item) => item.id !== id))
    const prefs = prefsRef.current
    const next = {
      ...prefs,
      disabled: prefs.disabled.filter((item) => item !== id),
      uploaded: prefs.uploaded.filter((item) => item.id !== id),
      deleted: table?.builtin ? [...prefs.deleted, id] : prefs.deleted,
    }
    persist(next)
  }

  function cancelSearch() {
    searchAbortRef.current?.abort()
    setSearching(false)
    setSearchProgress(null)
    setSearchCanceled(true)
    setMatches(null)
  }

  async function uploadTable(file: File) {
    setUploadError('')
    const rows = await parseUploadedTermFile(file)
    if (rows.length === 0) {
      setUploadError('未识别到可用的词条数据')
      setManagerOpen(true)
      return
    }

    const table: TermTable = {
      id: `upload-${Date.now()}`,
      label: file.name,
      enabled: true,
      builtin: false,
      rows,
    }
    setTables((current) => [...current, table])
    persist({
      ...prefsRef.current,
      uploaded: [
        ...prefsRef.current.uploaded,
        { id: table.id, label: file.name, enabled: true, format: detectUploadFormat(file), rows },
      ],
    })
    setManagerOpen(true)
  }

  const totalPages = matches ? Math.ceil(matches.length / PAGE_SIZE) : 0
  const safePage = matches ? Math.min(Math.max(1, page), Math.max(1, totalPages)) : 1
  const visibleMatches = matches?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE) ?? []

  return (
    <section className="term-panel">
      <div className="term-head">
        <div>
          <div className="result-eyebrow">Product Terms</div>
          <h2>现有词条</h2>
        </div>
        <div className="term-head-actions">
          <button
            type="button"
            className="ghost-button"
            aria-expanded={managerOpen}
            onClick={() => {
              if (!managerOpen) setManagerOpen(true)
            }}
          >
            <Table2 size={16} />
            数据表
          </button>
        </div>

        <div className={managerOpen ? 'term-manager open' : 'term-manager'} ref={managerRef}>
          <div className="term-manager-title">
            <span>数据表</span>
            <span className="term-manager-title-side">
              <span>{tables.length > 0 ? `${tables.length} 个` : '无'}</span>
              <button
                type="button"
                className="term-manager-close"
                aria-label="关闭数据表"
                onClick={() => setManagerOpen(false)}
              >
                <X size={15} />
              </button>
            </span>
          </div>

          {uploadError ? <div className="term-upload-error">{uploadError}</div> : null}

          <div className="term-table-list">
            <button className="term-manager-upload" type="button" onClick={() => fileInputRef.current?.click()}>
              <Database size={15} />
              上传数据表
            </button>

            {loading ? (
              <p className="term-empty">正在读取 TM 词条数据…</p>
            ) : tables.length === 0 ? (
              <p className="term-empty">还没有可检索的数据表</p>
            ) : (
              tables.map((table) => (
                <div className="term-table-row" key={table.id}>
                  <Search size={15} />
                  <div className="term-table-info">
                    <strong title={table.label}>{table.label}</strong>
                    <span>{table.rows.length.toLocaleString()} 条</span>
                  </div>
                  <button
                    type="button"
                    className={table.enabled ? 'term-switch on' : 'term-switch'}
                    onClick={() => toggleTable(table.id)}
                    aria-pressed={table.enabled}
                  >
                    <span />
                  </button>
                  <button
                    type="button"
                    className="icon-button small"
                    onClick={() => deleteTable(table.id)}
                    aria-label={`删除 ${table.label}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.txt,.json,.md,.markdown,.xlsx,.xls"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) uploadTable(file)
          event.target.value = ''
        }}
      />

      <div className="term-results">
        <div className="term-results-head">
          <span>匹配词条</span>
          {matches && matches.length > 0 ? <span>共 {matches.length} 条</span> : null}
        </div>

        {searching || searchCanceled ? (
          <div className="term-search-state">
            {searching ? (
              <>
                <div className="term-search-bar">
                  <span
                    style={{
                      width: `${
                        searchProgress && searchProgress.total > 0
                          ? Math.round((searchProgress.done / searchProgress.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="term-search-meta">
                  <span>
                    {searchProgress ? `${searchProgress.done}/${searchProgress.total}` : '准备中…'}
                  </span>
                  <button type="button" onClick={cancelSearch}>
                    取消
                  </button>
                </div>
              </>
            ) : (
              <p className="term-empty">已取消检索</p>
            )}
          </div>
        ) : null}

        {!query ? (
          <div className="term-empty-state">
            <div className="empty-mark">
              <Search size={22} />
            </div>
            <h2>查询你的第一条现有词条</h2>
            <p>填写场景信息后点击「查询现有词条」，系统会在产品已启用数据表里做全文包含检索，内容或标题里含有输入关键词即可命中。</p>
          </div>
        ) : matches && matches.length === 0 ? (
          <p className="term-empty">产品中无相关词条</p>
        ) : matches && matches.length > 0 ? (
          <>
            <div className="term-match-list">
              {visibleMatches.map((match, index) => (
                <div
                  className="term-match-item"
                  key={`${match.source}-${match.target}-${(safePage - 1) * PAGE_SIZE + index}`}
                >
                  <div className="term-match-score">{match.score}%</div>
                  <div className="term-match-copy">
                    <strong>{match.target || match.source}</strong>
                    <span>{match.source}</span>
                    <small>{match.table}</small>
                  </div>
                  <button
                    type="button"
                    className="term-match-add"
                    title="设为参考词条"
                    onClick={() =>
                      onAddReference([match.target, match.source].filter(Boolean).join('\n'))
                    }
                  >
                    <Plus size={15} />
                  </button>
                </div>
              ))}
            </div>
            <TermPagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          </>
        ) : searching ? null : searchCanceled ? (
          <p className="term-empty">已取消检索</p>
        ) : (
          <p className="term-empty">正在检索…</p>
        )}
      </div>
    </section>
  )
}
