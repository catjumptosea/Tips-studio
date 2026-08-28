import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Search, Settings, WandSparkles } from 'lucide-react'
import './App.css'
import type { GeneratedPrompt, HistoryItem, PromptCategory, ProviderConfig, ToneOption } from './types'
import { getCategory, getTone, promptCategories, toneOptions, providerPresets } from './data/options'
import { generatePrompt } from './lib/ai'
import { loadHistory, loadProviderConfig, saveHistory, saveProviderConfig } from './lib/storage'
import { Header } from './components/Header'
import { OptionPicker } from './components/OptionPicker'
import { ProviderPanel } from './components/ProviderPanel'
import { PromptBrief } from './components/PromptBrief'
import { ResultPanel } from './components/ResultPanel'
import { TermLibraryPanel, type TermQuery } from './components/TermLibraryPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { TonePicker } from './components/TonePicker'
import { ContentSpecPage, type ContentSpecPageHandle, type SpecPositionState } from './components/ContentSpecPage'

const defaultConfig: ProviderConfig = {
  provider: 'OpenAI 兼容',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
}

type ConnectionState = 'idle' | 'ok' | 'error'

const activeViewStorageKey = 'tips-studio:active-view'

function getInitialActiveView(): 'studio' | 'spec' {
  if (typeof window === 'undefined') return 'studio'
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('view')
  if (fromQuery === 'studio' || fromQuery === 'spec') return fromQuery
  return 'studio'
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  const [providerInit] = useState(() => {
    const saved = loadProviderConfig() ?? defaultConfig
    return {
      config: saved,
      connection: saved.apiKey ? 'ok' : 'idle',
    } as const
  })
  const [config, setConfig] = useState<ProviderConfig>(providerInit.config)
  const [categoryId, setCategoryId] = useState(promptCategories[0].id)
  const [toneId, setToneId] = useState(toneOptions[0].id)
  const [scene, setScene] = useState('')
  const [useSceneAsChinese, setUseSceneAsChinese] = useState(false)
  const [useReference, setUseReference] = useState(false)
  const [referenceText, setReferenceText] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory())
  const [result, setResult] = useState<GeneratedPrompt>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [connection, setConnection] = useState<ConnectionState>(providerInit.connection)
  const [configPromptOpen, setConfigPromptOpen] = useState(false)
  const [scenePromptOpen, setScenePromptOpen] = useState(false)
  const [modes, setModes] = useState<string[]>(promptCategories[0].modes ?? [])
  const [termQuery, setTermQuery] = useState<TermQuery>()
  const [activePanel, setActivePanel] = useState<'result' | 'terms'>('result')
  const [activeView, setActiveView] = useState<'studio' | 'spec'>(getInitialActiveView)
  const [specSearchQuery, setSpecSearchQuery] = useState('')
  const applyingHistoryRef = useRef(false)
  const specContentRef = useRef<ContentSpecPageHandle | null>(null)
  const specPositionRef = useRef<SpecPositionState | null>(null)

  const category: PromptCategory = useMemo(() => getCategory(categoryId), [categoryId])
  const tone: ToneOption = useMemo(() => getTone(toneId), [toneId])

  useEffect(() => {
    saveProviderConfig(config)
  }, [config])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', activeView)
    if (activeView === 'studio') url.hash = ''
    window.history.replaceState(null, '', url.toString())
    window.localStorage.setItem(activeViewStorageKey, activeView)
  }, [activeView])

  useEffect(() => {
    saveHistory(history)
  }, [history])

  useEffect(() => {
    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false
      return
    }
    setModes(category.modes ?? [])
  }, [category.id, category.modes])

  function isModelConfigured() {
    const preset = providerPresets.find(
      (item) => item.label === config.provider || item.baseUrl === config.baseUrl,
    )
    if (preset?.needsKey === false) {
      return Boolean(config.baseUrl.trim() && config.model.trim())
    }
    return Boolean(config.apiKey.trim() && config.baseUrl.trim() && config.model.trim())
  }

  async function runGenerate(options?: { followUp?: string }) {
    if (!scene.trim()) {
      setScenePromptOpen(true)
      setConfigPromptOpen(false)
      setError('')
      return
    }
    setScenePromptOpen(false)
    if (!isModelConfigured()) {
      setConfigPromptOpen(true)
      setError('')
      return
    }
    setConfigPromptOpen(false)
    setLoading(true)
    setError('')
    setActivePanel('result')
    try {
      const output = await generatePrompt({
        category,
        tone,
        scene,
        useSceneAsChinese,
        useReference,
        referenceText,
        modes: category.modes?.length ? modes : undefined,
        followUp: options?.followUp,
        currentResult: options?.followUp && result ? result : undefined,
        config,
      })
      setResult(output)
      const now = new Date()
      const item: HistoryItem = {
        id: makeId(),
        createdAt: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        categoryLabel: category.label,
        toneLabel: tone.label,
        scene,
        useSceneAsChinese,
        useReference,
        referenceText,
        modes: category.modes?.length ? modes : undefined,
        result: output,
      }
      setHistory((items) => [item, ...items].slice(0, 20))
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function handleSaveConfig(next: ProviderConfig) {
    setConfig(next)
    setConnection(next.apiKey ? 'ok' : 'idle')
    setConfigPromptOpen(false)
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id)
    const nextCategory = promptCategories.find((item) => item.id === id)
    if (nextCategory?.modes?.length) {
      setModes(nextCategory.modes)
    }
    setResult(undefined)
  }

  function handleTermQuery() {
    if (!scene.trim()) {
      setScenePromptOpen(true)
      setConfigPromptOpen(false)
      return
    }
    setScenePromptOpen(false)
    const zh = scene.trim()
    const en = scene.trim()
    setActivePanel('terms')
    setTermQuery({ id: Date.now(), zh, en })
  }

  function handleAddReference(text: string) {
    setUseReference(true)
    setReferenceText(text)
  }

  function selectHistory(item: HistoryItem) {
    setResult(item.result)
    setActivePanel('result')
    setHistoryOpen(false)
    const category = promptCategories.find((c) => c.label === item.categoryLabel)
    if (category) setCategoryId(category.id)
    const tone = toneOptions.find((t) => t.label === item.toneLabel)
    if (tone) setToneId(tone.id)
    setScene(item.scene ?? '')
    setUseSceneAsChinese(item.useSceneAsChinese ?? false)
    setUseReference(item.useReference ?? false)
    setReferenceText(item.referenceText ?? '')
    applyingHistoryRef.current = true
    setModes(Array.isArray(item.modes) ? item.modes : category?.modes ?? [])
  }

  function clearHistory() {
    setHistory([])
    setResult(undefined)
  }

  function deleteHistory(id: string) {
    setHistory((items) => items.filter((item) => item.id !== id))
  }

  const modelLabel = config.model

  return (
    <div className="app-shell">
      <Header
        modelLabel={modelLabel}
        status={connection}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        activeView={activeView}
        onOpenSpec={() => setActiveView('spec')}
        onBackStudio={() => {
          const position = specContentRef.current?.snapshot()
          if (position) specPositionRef.current = position
          setActiveView('studio')
        }}
        guideSearchQuery={specSearchQuery}
        onGuideSearchChange={setSpecSearchQuery}
        onGuideResultSelect={(anchorId, query) => specContentRef.current?.goToAnchor(anchorId, query)}
      />

      {activeView === 'spec' ? (
        <ContentSpecPage ref={specContentRef} initialPosition={specPositionRef.current} />
      ) : (
        <main className="studio-layout workbench-layout">
        <div className="left-rail">
          <OptionPicker
            title="提示词类型"
            hint="选择要生成的界面文案类别"
            items={promptCategories}
            value={categoryId}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="config-column">
          <section className="composer-panel">
            <div className="composer-head">
              <div>
                <span className="eyebrow">当前类型</span>
                <h1>{category.label}</h1>
              </div>
            </div>

            <PromptBrief category={category} tone={tone} />

            <TonePicker value={toneId} onChange={setToneId} options={toneOptions} />

            <div className="field-label-row">
              <label className="field-label compact" htmlFor="scene">
                补充场景或功能描述
                <span className="required-mark">*</span>
              </label>
              <button
                type="button"
                className="text-clear-button"
                disabled={!scene}
                onClick={() => setScene('')}
                aria-label="清空补充场景或功能描述"
              >
                清空
              </button>
            </div>
            <div className="textarea-field">
              <textarea
                id="scene"
                className="scene-input"
                rows={5}
                value={scene}
                onChange={(event) => {
                  setScene(event.target.value)
                  if (event.target.value.trim()) setScenePromptOpen(false)
                }}
                placeholder="例如：删除项目列表中的一条记录，用户误操作会造成不可恢复的损失。"
              />
              <span className="textarea-count">{scene.length}</span>
            </div>

            <div className="scene-as-chinese-toggle">
              <label className="switch small">
                <input
                  type="checkbox"
                  checked={useSceneAsChinese}
                  onChange={(event) => setUseSceneAsChinese(event.target.checked)}
                />
                <span className="track" />
              </label>
              <span className="scene-as-chinese-label">直接作为中文词条，AI 仅生成英文</span>
            </div>

            {category.modes?.length ? (
              <div className="mode-row">
                <span>输出长度</span>
                <div className="mode-group">
                  {category.modes.map((item) => {
                    const checked = modes.includes(item)
                    return (
                      <button
                        type="button"
                        key={item}
                        className={checked ? 'mode-chip active' : 'mode-chip'}
                        onClick={() =>
                          setModes((prev) =>
                            prev.includes(item)
                              ? prev.filter((value) => value !== item)
                              : [...prev, item],
                          )
                        }
                        aria-pressed={checked}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {scenePromptOpen ? (
              <div className="required-prompt" role="alert">
                <strong>请填写补充场景或功能描述</strong>
                <span>该输入为必填项，请先补充场景信息后再生成或查询。</span>
              </div>
            ) : null}

            <div className="reference-toggle">
              <div className="reference-toggle-title">
                <label className="switch small">
                  <input
                    type="checkbox"
                    checked={useReference}
                    onChange={(event) => setUseReference(event.target.checked)}
                  />
                  <span className="track" />
                </label>
                <span>参考词条</span>
                {useReference ? (
                  <button
                    type="button"
                    className="text-clear-button reference-clear-button"
                    disabled={!referenceText}
                    onClick={() => setReferenceText('')}
                    aria-label="清空参考词条"
                  >
                    清空
                  </button>
                ) : null}
              </div>
            </div>

            {useReference ? (
              <>
                <div className="textarea-field">
                  <textarea
                    className="reference-input"
                    rows={3}
                    value={referenceText}
                    onChange={(event) => setReferenceText(event.target.value)}
                placeholder="已有文案、命名风格或你想保持的用词。"
              />
              <span className="textarea-count">{referenceText.length}</span>
            </div>
              </>
            ) : null}

            {configPromptOpen ? (
              <div className="config-prompt" role="alert">
                <div className="config-prompt-text">
                  <strong>尚未配置 AI 模型</strong>
                  <span>请先配置模型后再生成双语提示词。</span>
                </div>
                <div className="config-prompt-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setConfigPromptOpen(false)
                      setSettingsOpen(true)
                    }}
                  >
                    <Settings size={16} />
                    配置模型
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setConfigPromptOpen(false)}
                  >
                    暂不配置
                  </button>
                </div>
              </div>
            ) : null}

            <div className="composer-actions">
              <button type="button" className="generate-button" onClick={() => runGenerate()} disabled={loading}>
                <WandSparkles size={18} />
                {loading ? '正在生成…' : '生成双语提示词'}
              </button>
              <button type="button" className="query-button" onClick={handleTermQuery}>
                <Search size={17} />
                查询现有词条
              </button>
            </div>
          </section>
        </div>

        <div className="result-column">
          <div className="content-tabs" role="tablist" aria-label="查询结果展示">
            <button
              type="button"
              className={activePanel === 'result' ? 'content-tab active' : 'content-tab'}
              onClick={() => setActivePanel('result')}
              role="tab"
              aria-selected={activePanel === 'result'}
            >
              <FileText size={15} />
              生成词条
            </button>
            <button
              type="button"
              className={activePanel === 'terms' ? 'content-tab active' : 'content-tab'}
              onClick={() => setActivePanel('terms')}
              role="tab"
              aria-selected={activePanel === 'terms'}
            >
              <Search size={15} />
              现有词条
            </button>
          </div>

          <div className="panel-tab-content" hidden={activePanel !== 'result'}>
            <ResultPanel
              result={result}
              loading={loading}
              error={error}
              onRegenerate={() => runGenerate()}
              onFollowUp={(text) => runGenerate({ followUp: text })}
              resultModes={category.modes?.length ? modes : []}
            />
          </div>

          <div className="panel-tab-content" hidden={activePanel !== 'terms'}>
            <TermLibraryPanel query={termQuery} onAddReference={handleAddReference} />
          </div>
        </div>
        </main>
      )}

      {historyOpen ? (
        <div className="drawer-backdrop" onClick={() => setHistoryOpen(false)}>
          <aside
            className="history-drawer"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="历史记录"
          >
            <HistoryPanel
              items={history}
              onSelect={selectHistory}
              onDelete={deleteHistory}
              onClear={clearHistory}
              onClose={() => setHistoryOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <ProviderPanel
        open={settingsOpen}
        config={config}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveConfig}
        onConnectionChange={setConnection}
      />
    </div>
  )
}
