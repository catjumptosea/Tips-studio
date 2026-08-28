import { useEffect, useState } from 'react'
import { KeyRound, Settings2, TestTube2, X } from 'lucide-react'
import type { ProviderConfig } from '../types'
import { providerPresets } from '../data/options'
import { testConnection } from '../lib/ai'

type ProviderPanelProps = {
  open: boolean
  config: ProviderConfig
  onClose: () => void
  onSave: (value: ProviderConfig) => void
  onConnectionChange: (status: 'idle' | 'ok' | 'error') => void
}

export function ProviderPanel({ open, config, onClose, onSave, onConnectionChange }: ProviderPanelProps) {
  const [draft, setDraft] = useState<ProviderConfig>(config)
  const [status, setStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(config)
      setStatus('idle')
      setMessage('')
    }
  }, [open, config])

  if (!open) return null

  function choosePreset(id: string) {
    const preset = providerPresets.find((item) => item.id === id)
    if (!preset) return
    setDraft((current) => ({
      ...current,
      provider: preset.label,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }))
  }

  async function runConnectionTest() {
    setStatus('testing')
    setMessage('正在测试连接…')
    try {
      await testConnection(draft)
      setStatus('ok')
      setMessage('连接正常')
      onConnectionChange('ok')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : '连接失败')
      onConnectionChange('error')
    }
  }

  function save() {
    onSave(draft)
    onClose()
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="provider-drawer"
        onMouseDown={(event) => event.stopPropagation()}
        aria-label="模型连接设置"
      >
        <div className="drawer-header">
          <div>
            <span className="eyebrow">AI 连接</span>
            <h2>模型接口配置</h2>
            <p>Key 只保存在本地浏览器，不会上传到服务端。</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭设置">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <fieldset className="form-field">
            <label htmlFor="provider-preset">服务商</label>
            <div className="preset-row">
              {providerPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={draft.provider === preset.label || draft.baseUrl === preset.baseUrl ? 'preset active' : 'preset'}
                  onClick={() => choosePreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="base-url">API Base URL</label>
            <input
              id="base-url"
              type="text"
              value={draft.baseUrl}
              onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="form-field">
            <label htmlFor="api-key">API Key</label>
            <div className="input-with-icon">
              <KeyRound size={16} aria-hidden="true" />
              <input
                id="api-key"
                type="password"
                value={draft.apiKey}
                onChange={(event) => setDraft({ ...draft, apiKey: event.target.value })}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="model-name">模型名称</label>
            <input
              id="model-name"
              type="text"
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              placeholder="gpt-4o-mini"
            />
          </div>

        </div>

        <div className="drawer-footer">
          <button type="button" className="ghost-button" onClick={runConnectionTest}>
            <TestTube2 size={16} />
            {status === 'testing' ? '测试中…' : '测试连接'}
          </button>
          <button type="button" className="primary-button" onClick={save}>
            <Settings2 size={16} />
            保存配置
          </button>
        </div>

        {message ? <div className={`connection-message ${status}`}>{message}</div> : null}
      </aside>
    </div>
  )
}
