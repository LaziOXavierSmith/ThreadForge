// Tiny persistent dedup store — a JSON file of seen ids with timestamps.
// Each independent stream (news, replies, ...) gets its own file so they never
// clash. Bounded so the file can't grow forever.

import { promises as fs } from 'fs'
import path from 'path'

const MAX_ENTRIES = 2000

interface Entry {
  id: string
  seenAt: string
}

export interface DedupStore {
  isSeen(id: string): Promise<boolean>
  markSeen(id: string): Promise<void>
}

export function createDedupStore(filename: string): DedupStore {
  const file = path.join(process.cwd(), 'data', filename)

  async function read(): Promise<Entry[]> {
    try {
      return JSON.parse(await fs.readFile(file, 'utf-8')) as Entry[]
    } catch {
      return []
    }
  }

  async function write(entries: Entry[]): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.tmp`
    await fs.writeFile(tmp, JSON.stringify(entries, null, 2))
    await fs.rename(tmp, file) // atomic swap
  }

  return {
    async isSeen(id) {
      return (await read()).some((e) => e.id === id)
    },
    async markSeen(id) {
      const entries = await read()
      if (entries.some((e) => e.id === id)) return
      entries.unshift({ id, seenAt: new Date().toISOString() })
      await write(entries.slice(0, MAX_ENTRIES))
    },
  }
}
