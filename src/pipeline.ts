// Orchestrator: the multi-agent review loop.
//
//   write  →  reviewer A (brand)  →  reviewer B (virality)  →  publish
//              └── up to N fix rounds ──┘
//
// Any reviewer that still rejects after the round budget blocks publication —
// better to skip a weak post than ship it. This is the heart of the framework:
// specialised agents disagreeing until a draft is genuinely good.

import { write } from './agents/writer'
import { loadReviewer } from './agents/reviewer'
import type { PlannedSlot, WrittenPost } from './agents/types'
import { logger } from './utils/logger'

const MAX_ROUNDS = 2

// Two independent gates with different jobs. Add a safety/toxicity reviewer the
// same way — one more prompt file, one more line here.
const reviewers = [
  { name: 'brand', run: loadReviewer('reviewer.md') },
  { name: 'virality', run: loadReviewer('reviewer-virality.md') },
]

export interface PipelineResult {
  post: WrittenPost | null
  /** Why it was skipped, if it was. */
  skippedBy?: string
  notes: string[]
}

export async function runSlot(slot: PlannedSlot): Promise<PipelineResult> {
  const notes: string[] = []
  let draft = await write(slot)
  logger.info(`drafted "${slot.theme}" (${draft.thread.length} posts)`)

  for (const gate of reviewers) {
    let approved = false
    for (let round = 1; round <= MAX_ROUNDS; round++) {
      const review = await gate.run(draft, slot)
      if (review.approved) {
        approved = true
        break
      }
      notes.push(`[${gate.name} r${round}] ${review.issues.join('; ')}`)
      if (review.fixed?.length) {
        draft = { ...draft, thread: review.fixed }
        logger.info(`${gate.name}: applied reviewer fixes (round ${round})`)
      } else {
        // No auto-fix — ask the writer to rewrite against the issues.
        draft = await write({ ...slot, theme: `${slot.theme}\nFix these issues: ${review.issues.join('; ')}` })
        logger.info(`${gate.name}: rewrote against issues (round ${round})`)
      }
    }
    if (!approved) {
      logger.warn(`${gate.name} gate rejected after ${MAX_ROUNDS} rounds — skipping slot`)
      return { post: null, skippedBy: gate.name, notes }
    }
  }

  return { post: draft, notes }
}
