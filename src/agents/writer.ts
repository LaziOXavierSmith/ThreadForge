// Writer agent — turns a planned slot into a Threads chain.
// The behaviour lives entirely in prompts/writer.md; this file just wires the
// prompt to the LLM and parses the result.

import { readFileSync } from 'fs'
import { join } from 'path'
import { callRole, extractJson, MODEL_STRONG } from './llm'
import type { PlannedSlot, WrittenPost } from './types'

const SYSTEM = readFileSync(join(process.cwd(), 'prompts', 'writer.md'), 'utf-8').trim()

interface Raw {
  thread?: unknown
  topic?: unknown
}

function parse(text: string): WrittenPost {
  const raw = extractJson<Raw>(text)
  const thread = Array.isArray(raw.thread)
    ? raw.thread.filter((p): p is string => typeof p === 'string').map((p) => p.trim()).filter(Boolean)
    : []
  if (thread.length === 0) throw new Error('Writer returned an empty thread')
  const topic = typeof raw.topic === 'string' && raw.topic.trim() ? raw.topic.trim().slice(0, 50) : 'general'
  return { thread, topic }
}

export async function write(slot: PlannedSlot): Promise<WrittenPost> {
  const user = `Theme: ${slot.theme}\nType: ${slot.type}\n\nWrite the Threads chain. Return strict JSON.`
  // Flagship content → stronger model. Reviews below can run on the cheap one.
  return parse(await callRole(SYSTEM, user, { model: MODEL_STRONG, maxTokens: 4000 }))
}
