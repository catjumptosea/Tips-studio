import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ToneOption } from '../types'

type TonePickerProps = {
  value: string
  options: ToneOption[]
  onChange: (id: string) => void
}

export function TonePicker({ value, options, onChange }: TonePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((item) => item.id === value) ?? options[0]

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!selected) return null

  return (
    <div className="tone-select-field">
      <div className="field-label">
        语气风格
        <span className="required-mark">*</span>
      </div>
      <div className="tone-select" ref={ref}>
        <button
          type="button"
          id="tone-style"
          className="tone-select-button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="tone-select-current">
            <span className="tone-select-label">{selected.label}</span>
            <span className="tone-select-desc">{selected.description}</span>
          </span>
          <ChevronDown size={16} />
        </button>

        {open ? (
          <div className="tone-menu" role="listbox" aria-label="语气风格">
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={item.id === value}
                className={item.id === value ? 'tone-option active' : 'tone-option'}
                onClick={() => {
                  onChange(item.id)
                  setOpen(false)
                }}
              >
                <span className="tone-option-label">{item.label}</span>
                <span className="tone-option-desc">{item.description}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
