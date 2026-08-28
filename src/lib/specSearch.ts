import { specSections } from '../data/contentSpec'
import type { SpecRule } from '../data/contentSpec'

export type SpecSearchHit = {
  id: string
  anchorId: string
  parent: string
  snippet: string
}

function includesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase())
}

function snippetAround(text: string, query: string) {
  const lower = text.toLowerCase()
  const index = lower.indexOf(query.toLowerCase())
  if (index === -1) return text

  const start = Math.max(0, index - 28)
  const end = Math.min(text.length, index + query.length + 38)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

function pushHit(
  hits: SpecSearchHit[],
  anchorId: string,
  parent: string,
  text: string,
  query: string,
) {
  if (!includesQuery(parent, query) && !includesQuery(text, query)) return
  const snippet = includesQuery(text, query) ? snippetAround(text, query) : parent
  const exists = hits.some(
    (hit) => hit.anchorId === anchorId && hit.snippet === snippet && hit.parent === parent,
  )
  if (!exists) {
    hits.push({ id: `${anchorId}-${hits.length}`, anchorId, parent, snippet })
  }
}

function visitRule(
  rule: SpecRule,
  parent: string,
  ruleAnchor: string,
  query: string,
  hits: SpecSearchHit[],
) {
  if (typeof rule === 'string') {
    if (includesQuery(rule, query)) {
      pushHit(hits, ruleAnchor, parent, rule, query)
    }
    return
  }

  const ruleText = rule.text ?? ''
  if (includesQuery(ruleText, query)) {
    pushHit(hits, ruleAnchor, parent, ruleText, query)
  }

  for (const example of rule.examples ?? []) {
    if (includesQuery(example.good, query)) {
      pushHit(hits, ruleAnchor, parent, example.good, query)
    }
    const badText = example.bad ?? ''
    if (badText && includesQuery(badText, query)) {
      pushHit(hits, ruleAnchor, parent, badText, query)
    }
  }

  for (const [index, child] of (rule.children ?? []).entries()) {
    const childAnchor = `${ruleAnchor}-child-${index}`
    visitRule(child, parent, childAnchor, query, hits)
  }
}

export function searchContentSpec(query: string): SpecSearchHit[] {
  const q = query.trim()
  if (!q) return []
  const hits: SpecSearchHit[] = []

  for (const section of specSections) {
    if (
      includesQuery(section.title, q) ||
      includesQuery(section.shortTitle, q) ||
      includesQuery(section.intro, q)
    ) {
      pushHit(hits, section.id, section.title, section.intro || section.title, q)
    }

    for (const item of section.items) {
      const parent = item.title || section.title
      if (includesQuery(item.title, q) || includesQuery(item.description ?? '', q)) {
        pushHit(hits, item.id, parent, item.description ?? item.title, q)
      }

      for (const example of item.examples ?? []) {
        if (includesQuery(example.good, q)) pushHit(hits, item.id, parent, example.good, q)
        const badText = example.bad ?? ''
        if (badText && includesQuery(badText, q)) pushHit(hits, item.id, parent, badText, q)
      }

      for (const [index, rule] of (item.rules ?? []).entries()) {
        visitRule(rule, parent, `${item.id}-rule-${index}`, q, hits)
      }
    }

    for (const lexicon of section.lexicons ?? []) {
      const parent = `${section.title} / ${lexicon.title}`
      if (includesQuery(lexicon.title, q) || includesQuery(lexicon.description, q)) {
        pushHit(hits, lexicon.id, parent, lexicon.description || lexicon.title, q)
      }
      const lexiconRows = lexicon.tables?.length
        ? lexicon.tables.flatMap((table) => table.rows)
        : lexicon.rows
      for (const row of lexiconRows) {
        const text = row.columns.join(' ')
        if (includesQuery(text, q)) {
          pushHit(hits, `${lexicon.id}-${row.id}`, parent, text, q)
        }
      }
    }
  }

  return hits.slice(0, 50)
}
