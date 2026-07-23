// Core primitive of the framework: a single helper to call an LLM "role".
// Every agent (planner, writer, reviewer) is just a system prompt + this call.
//
// Provider-agnostic by design — swap OpenAI for any compatible endpoint by
// changing BASE_URL / the request shape. Defaults to OpenAI.

import OpenAI from 'openai'

// Cheap model for most roles; a stronger model for the roles that carry the
// final quality (e.g. the flagship writer). Tune per your budget.
export const MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini'
export const MODEL_STRONG = process.env.LLM_MODEL_STRONG ?? 'gpt-4o'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface RoleOptions {
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Run one LLM "role": a system prompt + a user message → text response.
 * This is the atom every agent is built from.
 */
export async function callRole(system: string, user: string, opts: RoleOptions = {}): Promise<string> {
  const res = await client.chat.completions.create({
    model: opts.model ?? MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return res.choices[0]?.message?.content?.trim() ?? ''
}

/**
 * Agents that must return structured data ask for JSON. Models sometimes wrap
 * it in markdown fences or add prose — this extracts the first valid JSON object.
 */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = (fenced ? fenced[1] : text).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output')
  return JSON.parse(candidate.slice(start, end + 1)) as T
}
