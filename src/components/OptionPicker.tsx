import type { PromptCategory, ToneOption } from '../types'

type PromptPickerProps = {
  title: string
  hint: string
  items: PromptCategory[]
  value: string
  onChange: (id: string) => void
  tone?: false
}

type TonePickerProps = {
  title: string
  hint: string
  items: ToneOption[]
  value: string
  onChange: (id: string) => void
  tone: true
}

type Props = PromptPickerProps | TonePickerProps

export function OptionPicker(props: Props) {
  return (
    <section className="picker-section" aria-labelledby={props.title}>
      <div className="section-heading">
        <h3>{props.title}</h3>
        <p>{props.hint}</p>
      </div>
      <div className={props.tone ? 'tone-list' : 'category-list'}>
        {props.items.map((item) => {
          const active = props.value === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`option-row ${active ? 'active' : ''}`}
              onClick={() => props.onChange(item.id)}
              aria-pressed={active}
            >
              <span className="option-top">
                <span className="option-label">{item.label}</span>
                {'component' in item ? <span className="option-venn">{item.component}</span> : null}
              </span>
              <span className="option-desc">{item.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
