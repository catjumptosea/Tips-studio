import { useMemo, useState } from 'react'
import { Clock3, Search, Trash2, X } from 'lucide-react'
import type { HistoryItem } from '../types'

type HistoryPanelProps = {
  items: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onClear: () => void
  onClose?: () => void
}

function historySearchText(item: HistoryItem) {
  const result = item.result
  const lengthTexts = (result.results ?? [])
    .map((entry) => [entry.mode, entry.zh, entry.en].filter(Boolean).join(' '))
    .join(' ')
  return [
    item.categoryLabel,
    item.toneLabel,
    item.scene,
    item.referenceText,
    result.zh,
    result.en,
    result.other,
    result.raw,
    lengthTexts,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

export function HistoryPanel({ items, onSelect, onDelete, onClear, onClose }: HistoryPanelProps) {
  const [query, setQuery] = useState('')
  const keyword = query.trim().toLowerCase()

  const visibleItems = useMemo(() => {
    if (!keyword) return items
    return items.filter((item) => historySearchText(item).includes(keyword))
  }, [items, keyword])

  return (
    <aside className="history-panel">
      <div className="history-head">
        <div className="section-heading compact">
          <h3>历史记录</h3>
          <p>本地保存最近生成结果</p>
        </div>
        <div className="history-head-actions">
          {items.length > 0 && query ? (
            <button type="button" className="icon-button small" onClick={() => setQuery('')} aria-label="清除搜索">
              <Trash2 size={16} />
            </button>
          ) : null}
          {items.length > 0 && !query ? (
            <button type="button" className="icon-button small" onClick={onClear} aria-label="清空历史">
              <Trash2 size={16} />
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className="icon-button small" onClick={onClose} aria-label="关闭历史记录">
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="history-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索本地记录"
            aria-label="搜索本地记录"
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="history-empty">
          <Clock3 size={18} />
          <span>还没有生成记录</span>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="history-empty">
          <Search size={18} />
          <span>未找到相关记录</span>
        </div>
      ) : (
        <div className="history-list">
          {visibleItems.map((item) => (
            <div className="history-item" key={item.id}>
              <button type="button" className="history-item-main" onClick={() => onSelect(item)}>
                <span className="history-item-label">{item.categoryLabel}</span>
                <span className="history-item-tone">{item.toneLabel}</span>
                <span className="history-item-copy">{item.result.zh}</span>
                <span className="history-item-time">{item.createdAt}</span>
              </button>
              <button
                type="button"
                className="icon-button small history-item-delete"
                onClick={() => onDelete(item.id)}
                aria-label="删除此条记录"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
