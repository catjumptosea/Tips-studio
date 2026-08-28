import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Anchor } from 'antd'
import { specSections } from '../data/contentSpec'
import type {
  SpecExample,
  SpecItem,
  SpecLexicon,
  SpecRule,
  SpecRuleTable,
  SpecRuleTableCell,
  SpecSection,
} from '../data/contentSpec'
import './ContentSpecPage.css'

type ContentSpecPageProps = {
  initialPosition?: SpecPositionState | null
}

export type SpecPositionState = {
  sectionId: string
  scrollTop: number
}

export type ContentSpecPageHandle = {
  goToAnchor: (anchorId: string, highlightText?: string) => void
  snapshot: () => SpecPositionState
  restore: (state: SpecPositionState) => void
}

function getLexiconRows(lexicon: SpecLexicon) {
  if (lexicon.tables?.length) return lexicon.tables.flatMap((table) => table.rows)
  return lexicon.rows
}

function getSectionForAnchor(anchorId: string) {
  return specSections.find((section) => {
    if (section.id === anchorId) return true
    if (
      section.items.some(
        (item) =>
          item.id === anchorId ||
          anchorId.startsWith(`${item.id}-rule-`) ||
          anchorId.startsWith(`${item.id}-example-`),
      )
    )
      return true
    return section.lexicons?.some((lexicon) =>
      getLexiconRows(lexicon).some((row) => `${lexicon.id}-${row.id}` === anchorId),
    )
  })
}

function buildNavItems(section: SpecSection) {
  if (section.kind === 'lexicon') {
    return (section.lexicons ?? []).flatMap((lexicon) => {
      const children = getLexiconRows(lexicon).map((row) => ({
        id: `${lexicon.id}-${row.id}`,
        label: row.columns[0] || row.id,
        anchorId: `${lexicon.id}-${row.id}`,
        level: 3 as const,
      }))
      return [
        {
          id: lexicon.id,
          label: lexicon.title,
          anchorId: lexicon.id,
          level: 2 as const,
        },
        ...children,
      ]
    })
  }

  return section.items.flatMap((item) => {
    const itemEntry = {
      id: item.id,
      label: item.title,
      anchorId: item.id,
      level: 2 as const,
    }
    const sub = [
      ...(item.rules ?? []).map((rule, index) => {
        const ruleText = typeof rule === 'string' ? rule : rule.title || rule.text || rule.groupTitle || ''
        return {
          id: `${item.id}-rule-${index}`,
          label: ruleText.length > 22 ? `${ruleText.slice(0, 22)}…` : ruleText,
          anchorId: `${item.id}-rule-${index}`,
          level: 3 as const,
        }
      }),
      ...(item.examples ?? []).map((example, index) => ({
        id: `${item.id}-example-${index}`,
        label: example.goodImage ? '正确示范（图片）' : example.good.length > 18 ? `正确：${example.good.slice(0, 18)}…` : `正确：${example.good}`,
        anchorId: `${item.id}-example-${index}`,
        level: 3 as const,
      })),
    ]

    return [itemEntry, ...sub]
  })
}

export const ContentSpecPage = forwardRef<ContentSpecPageHandle, ContentSpecPageProps>(
  function ContentSpecPage(props, ref) {
  const initialSectionId = props.initialPosition?.sectionId ?? specSections[0]?.id ?? ''
  const [activeAnchorId, setActiveAnchorId] = useState(initialSectionId)
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mainRef = useRef<HTMLElement | null>(null)
  const highlightRef = useRef<HTMLElement[]>([])
  const highlightTimerRef = useRef<number | null>(null)
  const initialPositionRef = useRef<SpecPositionState | null>(props.initialPosition ?? null)
  const activeIndex = Math.max(0, specSections.findIndex((section) => section.id === activeSectionId))
  const activeSection = specSections[activeIndex]

  useLayoutEffect(() => {
    const position = initialPositionRef.current
    if (!position || !mainRef.current) return
    mainRef.current.scrollTop = position.scrollTop
  }, [])

  useImperativeHandle(ref, () => ({
    goToAnchor,
    snapshot: snapshotSpecState,
    restore: restoreSpecState,
  }))

  useEffect(() => {
    const root = mainRef.current
    if (!root || !activeSection) return
    const targets = Array.from(root.querySelectorAll<HTMLElement>('.spec-item[id], .spec-lexicon-group[id], .spec-rules > li[id]'))
    if (!targets.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
        if (!visible.length) return
        visible.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
        setActiveAnchorId(visible[0].id)
      },
      {
        root,
        rootMargin: '-20% 0px -45% 0px',
        threshold: 0.1,
      },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [activeSection, activeSectionId])

  function clearHighlights() {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    for (const mark of highlightRef.current) {
      if (mark.isConnected) {
        mark.replaceWith(document.createTextNode(mark.textContent ?? ''))
      }
    }
    highlightRef.current = []
  }

  function flashHighlights(target: HTMLElement, query: string) {
    const q = query.trim()
    if (!q) return
    clearHighlights()

    const created: HTMLElement[] = []
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (node.nodeType !== Node.TEXT_NODE) continue
      const text = node.nodeValue ?? ''
      const lowerText = text.toLowerCase()
      const lowerQuery = q.toLowerCase()
      let index = lowerText.indexOf(lowerQuery)
      if (index === -1) continue

      const fragment = document.createDocumentFragment()
      let lastIndex = 0
      while (index !== -1) {
        if (index > lastIndex) fragment.append(text.slice(lastIndex, index))
        const mark = document.createElement('mark')
        mark.className = 'search-flash-mark'
        mark.textContent = text.slice(index, index + q.length)
        fragment.append(mark)
        created.push(mark)
        lastIndex = index + q.length
        index = lowerText.indexOf(lowerQuery, lastIndex)
      }
      if (lastIndex < text.length) fragment.append(text.slice(lastIndex))
      node.parentNode?.replaceChild(fragment, node)
    }

    if (!created.length) return
    highlightRef.current = created
    highlightTimerRef.current = window.setTimeout(() => {
      clearHighlights()
    }, 3000)
  }

  function goToAnchor(anchorId: string, highlightText?: string) {
    setMobileNavOpen(false)
    const section = getSection(anchorId)
    if (section) {
      setActiveSectionId(section.id)
      setActiveAnchorId(anchorId)
    }
    setTimeout(() => {
      const target = document.getElementById(anchorId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        flashHighlights(target, highlightText ?? '')
      } else {
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 60)
  }

  function goToChapter(index: number) {
    const next = specSections[index]
    if (!next) return
    setMobileNavOpen(false)
    setActiveSectionId(next.id)
    setActiveAnchorId(next.id)
    setTimeout(() => {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 60)
  }

  function snapshotSpecState(): SpecPositionState {
    return {
      sectionId: activeSectionId,
      scrollTop: mainRef.current?.scrollTop ?? 0,
    }
  }

  function restoreSpecState(state: SpecPositionState) {
    const section = specSections.find((item) => item.id === state.sectionId)
    if (section) {
      setActiveSectionId(section.id)
      setActiveAnchorId(section.id)
    }
    setTimeout(() => {
      mainRef.current?.scrollTo({ top: state.scrollTop, behavior: 'auto' })
    }, 60)
  }

  function getSection(anchorId: string) {
    return getSectionForAnchor(anchorId)
  }

  const levelTwoAnchors = activeSection
    ? buildNavItems(activeSection)
        .filter((nav) => nav.level === 2)
        .map((nav) => ({
          key: nav.id,
          href: `#${nav.anchorId}`,
          title: nav.label,
        }))
    : []

  return (
    <div className="content-spec-page">
      <div className="spec-docs-layout">
        <button
          type="button"
          className="spec-mobile-nav-toggle"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
        >
          <Menu size={16} />
          目录
          <ChevronDown size={14} />
        </button>
        <aside className={`spec-sidebar${mobileNavOpen ? ' open' : ''}`}>
          <nav className="spec-nav">
            {specSections.map((section) => {
              const subNav = buildNavItems(section).filter((nav) => nav.level <= 2)
              return (
              <div className="spec-nav-group" key={section.id}>
                <button
                  type="button"
                  className={`spec-nav-section${activeSectionId === section.id ? ' active' : ''}`}
                  onClick={() => goToAnchor(section.id)}
                >
                  <span>{section.shortTitle}</span>
                  {subNav.length > 0 ? (
                    <ChevronRight size={14} className="spec-nav-arrow" aria-hidden="true" />
                  ) : null}
                </button>
                <div className={`spec-sub-nav${activeSectionId === section.id ? ' open' : ''}`}>
                  {subNav.map((nav) => (
                    <button
                      type="button"
                      key={nav.id}
                      className={`spec-nav-child level-${nav.level}${activeAnchorId === nav.anchorId ? ' active' : ''}`}
                      onClick={() => goToAnchor(nav.anchorId)}
                    >
                      {nav.label}
                    </button>
                  ))}
                </div>
              </div>
              )
            })}
          </nav>
        </aside>

        <main className="spec-main" ref={mainRef}>
          <div className="spec-content-inner">
          {activeSection ? [activeSection].map((section) => section.id === 'introduction' ? (
            <section className="spec-overview" id={section.id} key={section.id}>
              <div className="spec-overview-copy">
                <span className="spec-kicker">CONTENT STRATEGY</span>
                <h2>{section.title}</h2>
                <p>{section.intro}</p>
              </div>
            </section>
          ) : (
            <section className="spec-section" id={section.id} key={section.id}>
              <div className="spec-section-head">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.intro}</p>
                </div>
              </div>

              {section.kind === 'items' ? (
                <div className="spec-item-list">
                  {section.items.map((item) => renderItem(item))}
                </div>
              ) : (
                <div className="spec-lexicon">
                  {(section.lexicons ?? []).map((lexicon) => (
                    <div className="spec-lexicon-group" key={lexicon.id} id={lexicon.id}>
                      <div className="spec-lexicon-head">
                        <h3>{lexicon.title}</h3>
                        <p>{lexicon.description}</p>
                      </div>
                      {lexicon.tables?.length ? (
                        <div className="spec-lexicon-tables">
                          {lexicon.tables.map((table) => (
                            <div className="spec-lexicon-subtable" key={table.title}>
                              <div className="spec-table-wrap">
                                <table>
                                  <thead>
                                    <tr>
                                      {table.headers.map((header) => (
                                        <th key={header}>{header}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.map((row) => (
                                      <tr key={row.id} id={`${lexicon.id}-${row.id}`}>
                                        {row.columns.map((cell, index) => (
                                          <td key={`${row.id}-${index}`}>{cell || '—'}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="spec-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                {lexicon.headers.map((header) => (
                                  <th key={header}>{header}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {lexicon.rows.map((row) => (
                                <tr key={row.id} id={`${lexicon.id}-${row.id}`}>
                                  {row.columns.map((cell, index) => (
                                    <td key={`${row.id}-${index}`}>{cell || '—'}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )) : null}

          <nav className="spec-chapter-nav" aria-label="章节导航">
            {activeIndex > 0 ? (
              <button
                type="button"
                className="spec-chapter-nav-button prev"
                onClick={() => goToChapter(activeIndex - 1)}
              >
                <ChevronLeft size={17} />
                <span>
                  <small>上一章</small>
                  <strong>{specSections[activeIndex - 1].title}</strong>
                </span>
              </button>
            ) : (
              <span />
            )}
            {activeIndex < specSections.length - 1 ? (
              <button
                type="button"
                className="spec-chapter-nav-button next"
                onClick={() => goToChapter(activeIndex + 1)}
              >
                <span>
                  <small>下一章</small>
                  <strong>{specSections[activeIndex + 1].title}</strong>
                </span>
                <ChevronRight size={17} />
              </button>
            ) : (
              <span />
            )}
          </nav>

          </div>
        </main>

        <aside className={`spec-anchor-nav${levelTwoAnchors.length ? ' has-anchor' : ''}`} aria-label="Section anchor">
          {levelTwoAnchors.length > 0 ? (
            <Anchor
              affix={false}
              getContainer={() => mainRef.current || document.documentElement}
              targetOffset={16}
              items={levelTwoAnchors}
            />
          ) : null}
        </aside>
      </div>
    </div>
  )

  function renderItem(item: SpecItem) {
    function renderTableCell(cell: SpecRuleTableCell) {
      if (cell.highlight) {
        return (
          <>
            <span className="text-item-table--yuan">{cell.highlight}</span>
            <span>{cell.text}</span>
          </>
        )
      }
      return <>{cell.text}</>
    }

    function renderRuleTable(table: SpecRuleTable) {
      return (
        <div className="text-item__table" role="table" aria-label={table.headers.join('、')}>
          <div className="table-content">
            <ul>
              <li className="lineHead large">
                {table.headers.map((header) => (
                  <p className="element__large1" key={header}>
                    {header}
                  </p>
                ))}
              </li>
              {table.rows.map((row, rowIndex) => (
                <li className={`large${row.muted ? ' gray' : ''}`} key={`${row.cells[0]?.text ?? rowIndex}-${rowIndex}`}>
                  {row.cells.map((cell, cellIndex) => (
                    <div
                      className={`element__large${Math.min(cellIndex + 1, 3)} contant-height`}
                      key={`${rowIndex}-${cellIndex}`}
                    >
                      <div className="middle-y">{renderTableCell(cell)}</div>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    }

    function renderExampleContent(example: SpecExample, tone: 'good' | 'bad') {
      const image = tone === 'good' ? example.goodImage : example.badImage
      const alt = tone === 'good' ? example.good || '正确示范' : example.bad || '错误示范'
      if (image) {
        return <img className="spec-example-image" src={image} alt={alt} />
      }
      const content = tone === 'good' ? example.good : example.bad ?? ''
      return renderExampleLinks(content, example.links)
    }

    function renderExampleLinks(text: string, links?: string[]) {
      if (!links?.length) return text

      let nodes: Array<string | ReactNode> = [text]
      links.forEach((link, linkIndex) => {
        nodes = nodes.flatMap((node, nodeIndex) => {
          if (typeof node !== 'string') return [node]
          const parts = node.split(link)
          return parts.flatMap((part, partIndex) => {
            const chunks: Array<string | ReactNode> = []
            if (partIndex > 0) {
              chunks.push(
                <span key={`${linkIndex}-${nodeIndex}-${partIndex}`} className="spec-example-link">
                  {link}
                </span>,
              )
            }
            if (part) chunks.push(part)
            return chunks
          })
        })
      })

      return nodes
    }

    function renderExamplePair(example: SpecExample, pairKey: string, anchorId?: string) {
      const hasBad = Boolean(example.bad || example.badImage)
      const onlyImage = Boolean(
        (example.goodImage && !example.badImage) ||
          (example.badImage && !example.goodImage),
      )

      if (!hasBad) {
        return (
          <div className="spec-example-single spec-example spec-example-good" key={pairKey} id={anchorId}>
            <span>正确示范</span>
            <strong>{renderExampleContent(example, 'good')}</strong>
          </div>
        )
      }

      if (onlyImage) {
        const tone = example.goodImage ? 'good' : 'bad'
        const label = example.goodImage ? '正确示范' : '错误示范'
        return (
          <div className={`spec-example-single spec-example spec-example-${tone}`} key={pairKey} id={anchorId}>
            <span>{label}</span>
            <strong>{renderExampleContent(example, tone)}</strong>
          </div>
        )
      }

      return (
        <div className="spec-example-pair" key={pairKey} id={anchorId}>
          <div className="spec-example spec-example-good">
            <span>正确示范</span>
            <strong>{renderExampleContent(example, 'good')}</strong>
          </div>
          <div className="spec-example spec-example-bad">
            <span>错误示范</span>
            <strong>{renderExampleContent(example, 'bad')}</strong>
          </div>
        </div>
      )
    }

    function renderInlineBold(text: string) {
      const parts = text.split('**')
      if (parts.length < 2 || parts.length % 2 === 0) return text
      return parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={`${part}-${index}`}>{part}</strong>
        ) : (
          part
        ),
      )
    }

    function renderRuleChildren(children: SpecRule[], keyPrefix: string, depth = 1) {
      const level = depth + 3
      return (
        <ul className="spec-rule-children" data-level={level}>
          {children.map((child, index) => {
            const key = `${keyPrefix}-${index}`
            const childText = typeof child === 'string' ? child : child.text ?? ''
            const childTitle = typeof child === 'string' ? undefined : child.title
            const childExamples = typeof child === 'string' ? undefined : child.examples

            return (
              <li key={key} id={key} data-level={level}>
                {childTitle ? <span className="spec-rule-title">{childTitle}</span> : null}
                {renderInlineBold(childText)}
                {typeof child !== 'string' && child.table ? renderRuleTable(child.table) : null}
                {typeof child !== 'string' && child.demoImage ? (
                  <div className="spec-rule-demo">
                    <img
                      className="spec-rule-demo-image"
                      src={child.demoImage}
                      alt={child.demoAlt ?? '示范图片'}
                    />
                  </div>
                ) : null}
                {typeof child !== 'string' && child.children?.length
                  ? renderRuleChildren(child.children, key, depth + 1)
                  : null}
                {childExamples?.length ? (
                  <div className="spec-examples spec-examples-inline">
                    {childExamples.map((example) =>
                      renderExamplePair(example, `${example.good}-${example.bad}`),
                    )}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )
    }

    function renderRuleLine(rule: SpecRule, ruleIndex: number, prefix: string) {
      const ruleExamples = typeof rule === 'string' ? undefined : rule.examples
      const ruleText = typeof rule === 'string' ? rule : rule.text ?? ''
      const hasTitle = typeof rule !== 'string' && Boolean(rule.title)
      const ruleChildren =
        typeof rule === 'string'
          ? []
          : hasTitle
            ? rule.text
              ? [
                  {
                    text: rule.text ?? '',
                    children: rule.children?.length ? rule.children : undefined,
                  },
                ]
              : (rule.children ?? [])
            : (rule.children ?? [])

      return (
        <li key={`${prefix}-rule-${ruleIndex}`} id={`${prefix}-rule-${ruleIndex}`}>
          {hasTitle ? (
            <span className="spec-rule-title">{rule.title}</span>
          ) : null}
          {ruleText ? <span className="spec-rule-item-text">{ruleText}</span> : null}
          {ruleChildren.length
            ? renderRuleChildren(ruleChildren, `${prefix}-rule-${ruleIndex}-child`)
            : null}
          {typeof rule !== 'string' && rule.table ? (
            renderRuleTable(rule.table)
          ) : null}
          {typeof rule !== 'string' && rule.demoImage ? (
            <div className="spec-rule-demo">
              <img
                className="spec-rule-demo-image"
                src={rule.demoImage}
                alt={rule.demoAlt ?? '示范图片'}
              />
            </div>
          ) : null}
          {ruleExamples?.length ? (
            <div className="spec-examples spec-examples-inline">
              {ruleExamples.map((example) =>
                renderExamplePair(example, `${example.good}-${example.bad}`),
              )}
            </div>
          ) : null}
        </li>
      )
    }

    return (
      <article className="spec-item" id={item.id} key={item.id}>
        <div className="spec-item-title">
          <h3>{item.title}</h3>
          {item.description ? <p>{item.description}</p> : null}
        </div>
        {item.rules?.length ? (
          <ul className="spec-rules">
            {item.rules.map((rule, ruleIndex) => {
              const isGroup = typeof rule === 'object' && rule !== null && Boolean(rule.groupTitle && rule.groupRules)
              if (isGroup) {
                return (
                  <li className="spec-rule-group" key={`${item.id}-rule-${ruleIndex}`} id={`${item.id}-rule-${ruleIndex}`}>
                    <span className="spec-rule-group-title">{rule.groupTitle}</span>
                    <ul className="spec-rules spec-rule-group-rules">
                      {rule.groupRules?.map((innerRule, innerIndex) =>
                        renderRuleLine(innerRule, innerIndex, `${item.id}-group-${ruleIndex}`),
                      )}
                    </ul>
                  </li>
                )
              }
              return renderRuleLine(rule, ruleIndex, item.id)
            })}
          </ul>
        ) : null}
        {item.examples?.length ? (
          <div className="spec-examples">
            {item.examples.map((example, exampleIndex) => (
              renderExamplePair(example, `${example.good}-${example.bad}`, `${item.id}-example-${exampleIndex}`)
            ))}
          </div>
        ) : null}
      </article>
    )
  }
})
