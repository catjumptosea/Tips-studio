import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BookOpenText, History, Languages, LayoutDashboard, Search, Settings, X } from 'lucide-react'
import { searchContentSpec } from '../lib/specSearch'

type ConnectionStatus = 'idle' | 'ok' | 'error'
type ViewMode = 'studio' | 'spec'

type HeaderProps = {
  modelLabel: string
  status: ConnectionStatus
  onOpenSettings: () => void
  onOpenHistory: () => void
  activeView: ViewMode
  onOpenSpec: () => void
  onBackStudio: () => void
  guideSearchQuery: string
  onGuideSearchChange: (value: string) => void
  onGuideResultSelect: (anchorId: string, query: string) => void
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim()
  if (!normalized) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = normalized.toLowerCase()
  const nodes: ReactNode[] = []
  let from = 0
  let index = 0
  let key = 0

  while ((index = lowerText.indexOf(lowerQuery, from)) !== -1) {
    if (index > from) nodes.push(text.slice(from, index))
    nodes.push(<mark key={key}>{text.slice(index, index + normalized.length)}</mark>)
    from = index + normalized.length
    key += 1
  }

  if (from < text.length) nodes.push(text.slice(from))
  return <>{nodes}</>
}

export function Header({
  modelLabel,
  status,
  onOpenSettings,
  onOpenHistory,
  activeView,
  onOpenSpec,
  onBackStudio,
  guideSearchQuery,
  onGuideSearchChange,
  onGuideResultSelect,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const results = useMemo(() => searchContentSpec(guideSearchQuery), [guideSearchQuery])

  useEffect(() => {
    if (!searchOpen) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (target instanceof Node && searchRef.current?.contains(target)) return
      setSearchOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [searchOpen])

  function clearGuideSearch() {
    setSearchOpen(false)
    onGuideSearchChange('')
  }

  const statusLabel = {
    idle: '等待连接',
    ok: '连接正常',
    error: '连接异常',
  }[status]

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <Languages size={18} strokeWidth={2} />
        </div>
        <div>
          <div className="brand-title">
            Tips Studio <span className="brand-version">v1.8.24</span>
          </div>
          <div className="brand-subtitle">双语产品提示词工作台</div>
        </div>
      </div>

      <nav className="header-tabs" aria-label="主导航">
        <button
          type="button"
          className={`header-tab${activeView === 'studio' ? ' active' : ''}`}
          onClick={onBackStudio}
        >
          <LayoutDashboard size={16} />
          工作台
        </button>
        <button
          type="button"
          className={`header-tab${activeView === 'spec' ? ' active' : ''}`}
          onClick={onOpenSpec}
        >
          <BookOpenText size={16} />
          指南
        </button>
      </nav>

      <div className="header-actions">
        {activeView === 'studio' ? (
          <>
            <div className={`connection-chip ${status}`}>
              <span className="status-dot" />
              {modelLabel || statusLabel}
            </div>
            <button type="button" className="primary-button" onClick={onOpenSettings}>
              <Settings size={16} />
              模型
            </button>
            <button type="button" className="ghost-button" onClick={onOpenHistory}>
              <History size={16} />
              历史记录
            </button>
          </>
        ) : (
          <div className="header-search" ref={searchRef}>
            <Search size={16} aria-hidden="true" />
            <input
              aria-label="搜索指南内容"
              value={guideSearchQuery}
              onChange={(event) => {
                const value = event.target.value
                onGuideSearchChange(value)
                if (value.trim()) setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="搜索指南内容"
            />
            {guideSearchQuery ? (
              <button type="button" aria-label="清空搜索" onClick={clearGuideSearch}>
                <X size={15} />
              </button>
            ) : null}
            {searchOpen && guideSearchQuery.trim() ? (
              <div className="header-search-dropdown" role="listbox" aria-label="指南搜索结果">
                {results.length ? (
                  results.map((hit) => (
                    <button
                      type="button"
                      key={hit.id}
                      role="option"
                      onClick={() => {
                        onGuideResultSelect(hit.anchorId, guideSearchQuery)
                        setSearchOpen(false)
                      }}
                    >
                      <span className="search-result-parent">
                        <HighlightedText text={hit.parent} query={guideSearchQuery} />
                      </span>
                      <span className="search-result-snippet">
                        <HighlightedText text={hit.snippet} query={guideSearchQuery} />
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="header-search-empty">未找到相关指南内容</div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
