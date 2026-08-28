import type { PromptCategory, ToneOption } from '../types'

type PromptBriefProps = {
  category: PromptCategory
  tone: ToneOption
}

export function PromptBrief({ category, tone }: PromptBriefProps) {
  return (
    <>
      <div className="brief-title">基础提示词</div>
      <section className="prompt-brief">
        <div className="brief-column examples">
          <span className="brief-label">参考示例</span>
          <ul>
            {category.examples.slice(0, 3).map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
        <div className="brief-column">
          <span className="brief-label">撰写要求</span>
          <p>{category.purpose}</p>
          <ul>
            {category.rules.slice(0, 3).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
        <div className="brief-column">
          <span className="brief-label">语气要求</span>
          <p>{tone.characteristics}</p>
          <ul>
            {tone.requirements.slice(0, 3).map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
