// Reviewer agent — the quality gate. Checks a draft against the brief and
// either approves it or returns concrete issues (and, optionally, a fixed
// version so the pipeline can converge in fewer rounds).
//
// Run several reviewers with different jobs (brand/tone, virality, safety) by
// pointing each at a different prompt file — same code, different lens.

import { readFileSync } from 'fs'
import { join } from 'path'
import { callRole, extractJson } from './llm'
import type { PlannedSlot, Review, WrittenPost } from './types'

export function loadReviewer(promptFile: string): (draft: WrittenPost, slot: PlannedSlot) => Promise<Review> {
  const system = readFileSync(join(process.cwd(), 'prompts', promptFile), 'utf-8').trim()

  return async function review(draft: WrittenPost, slot: PlannedSlot): Promise<Review> {
    const user = [
      `Brief — theme: ${slot.theme}, type: ${slot.type}`,
      `Draft (${draft.thread.length} posts):`,
      draft.thread.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      '',
      'Review against the checklist. Return strict JSON: { approved, issues[], fixed?[] }.',
    ].join('\n')

    const raw = extractJson<{ approved?: unknown; issues?: unknown; fixed?: unknown }>(await callRole(system, user))
    return {
      approved: raw.approved === true,
      issues: Array.isArray(raw.issues) ? raw.issues.filter((i): i is string => typeof i === 'string') : [],
      fixed: Array.isArray(raw.fixed) ? raw.fixed.filter((i): i is string => typeof i === 'string') : undefined,
    }
  }
}
