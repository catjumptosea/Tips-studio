import { useState } from 'react'
import { Check, Clipboard, Copy, MessageCircle, RefreshCcw, SendHorizontal, Sparkles } from 'lucide-react'
import type { GeneratedPrompt, PromptLengthResult } from '../types'

type ResultPanelProps = {
  result?: GeneratedPrompt
  loading: boolean
  error?: string
  onRegenerate: () => void
  onFollowUp: (text: string) => void
  resultModes?: string[]
}

export function ResultPanel({ result, loading, error, onRegenerate, onFollowUp, resultModes = [] }: ResultPanelProps) {
  const [copied, setCopied] = useState('')
  const [activeTabId, setActiveTab] = useState('')
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUpText, setFollowUpText] = useState('')

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    window.setTimeout(() => setCopied(''), 1400)
  }

  function buildCardCopy(result: GeneratedPrompt, activeTab: string, activeResult?: PromptLengthResult) {
    if (activeTab === '原始结果') return result.raw || ''

    const item = activeResult ?? { zh: result.zh, en: result.en }
    return `中文提示词：${item.zh}\nEnglish prompt: ${item.en}`
  }

  function renderLanguagePair(id: string, zh: string, en: string) {
    return (
      <>
        <div className="language-block">
          <div className="language-head">
            <span>中文提示词</span>
            <button type="button" className="icon-button small" onClick={() => copy(zh, `${id}-zh`)}>
              {copied === `${id}-zh` ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <p className="copy-body">{zh}</p>
        </div>

        <div className="language-block">
          <div className="language-head">
            <span>English prompt</span>
            <button type="button" className="icon-button small" onClick={() => copy(en, `${id}-en`)}>
              {copied === `${id}-en` ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <p className="copy-body">{en}</p>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <section className="result-panel loading-state">
        <div className="loader-ring" aria-hidden="true" />
        <h2>正在生成双语提示词</h2>
        <p>模型返回后会同步展示中文与英文版本。</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="result-panel error-state">
        <div className="error-glyph">!</div>
        <h2>生成失败</h2>
        <p>{error}</p>
        <button type="button" className="ghost-button" onClick={onRegenerate}>
          <RefreshCcw size={16} />
          重试
        </button>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="result-panel empty-result">
        <div className="empty-mark">
          <Sparkles size={22} />
        </div>
        <h2>生成你的第一条提示词</h2>
        <p>选择类型与语气，再填写场景描述，右侧会输出中英文对照文案。</p>
      </section>
    )
  }

  const tabModes = resultModes
  const tabs = tabModes.length ? [...tabModes, '原始结果'] : ['结果', '原始结果']
  const activeTab = tabs.includes(activeTabId) ? activeTabId : (tabs[0] ?? '')
  const activeRaw = activeTab === '原始结果'
  const activeResult = activeRaw ? undefined : result.results?.find((item) => item.mode === activeTab)

  return (
    <section className="result-panel">
      <div className="result-toolbar">
        <div>
          <div className="result-eyebrow">{result.category}</div>
          <h2>双语提示词</h2>
        </div>
      </div>

      {tabs.length ? (
        <div className="result-tabs-row">
          <div className="result-tabs" role="tablist" aria-label="生成结果">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? 'result-tab active' : 'result-tab'}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          </div>
          <button
            type="button"
            className="ghost-button card-copy-button"
            onClick={() => copy(buildCardCopy(result, activeTab, activeResult), 'card')}
          >
            {copied === 'card' ? <Check size={16} /> : <Copy size={16} />}
            复制完整卡片
          </button>
        </div>
      ) : null}

      {activeRaw ? (
        <div className="raw-block">
          <div className="language-head">
            <span>原始结果</span>
            <button type="button" className="icon-button small" onClick={() => copy(result.raw, 'raw')}>
              {copied === 'raw' ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <p className="copy-body">{result.raw || '暂无原始内容'}</p>
        </div>
      ) : activeResult ? (
        renderLanguagePair(activeResult.mode, activeResult.zh, activeResult.en)
      ) : (
        renderLanguagePair('default', result.zh, result.en)
      )}

      <div className="result-footer-actions">
        <button type="button" className="ghost-button" onClick={() => setFollowUpOpen((value) => !value)}>
          <MessageCircle size={16} />
          继续追问
        </button>
        <button type="button" className="primary-button" onClick={onRegenerate}>
          <RefreshCcw size={16} />
          重新生成
        </button>
      </div>

      {followUpOpen ? (
        <form
          className="follow-up-panel"
          onSubmit={(event) => {
            event.preventDefault()
            const value = followUpText.trim()
            if (!value) return
            onFollowUp(value)
            setFollowUpText('')
            setFollowUpOpen(false)
          }}
        >
          <label className="follow-up-label" htmlFor="follow-up-input">
            继续追问
          </label>
          <textarea
            id="follow-up-input"
            className="follow-up-input"
            rows={3}
            value={followUpText}
            onChange={(event) => setFollowUpText(event.target.value)}
            placeholder="例如：把这版文案改得更简洁，语气再正式一点。"
          />
          <div className="follow-up-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setFollowUpOpen(false)
                setFollowUpText('')
              }}
            >
              取消
            </button>
            <button type="submit" className="primary-button" disabled={!followUpText.trim()}>
              <SendHorizontal size={16} />
              发送并重新生成
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
