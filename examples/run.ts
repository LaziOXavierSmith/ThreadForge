// Demo: run one slot through the multi-agent pipeline.
//
//   npx tsx examples/run.ts
//
// Set OPENAI_API_KEY to generate for real. Publishing is commented out — flip it
// on once THREADS_ACCESS_TOKEN / THREADS_USER_ID are set.

import 'dotenv/config'
import { runSlot } from '../src/pipeline'
import { logger } from '../src/utils/logger'
// import { publishChain } from '../src/publish/threads'

async function main() {
  const result = await runSlot({
    theme: 'Why "just add AI" fails without a clear job to do',
    type: 'opinion',
  })

  if (!result.post) {
    logger.warn(`skipped by ${result.skippedBy} gate`)
    result.notes.forEach((n) => logger.info(n))
    return
  }

  logger.success(`approved — topic: ${result.post.topic}`)
  result.post.thread.forEach((p, i) => console.log(`\n[${i + 1}/${result.post!.thread.length}] ${p}`))

  // await publishChain(result.post.thread, { topicTag: result.post.topic })
  // logger.success('published to Threads')
}

main().catch((e) => {
  logger.error((e as Error).message)
  process.exit(1)
})
