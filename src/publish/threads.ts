// Publisher — posts a chain to Meta's Threads via the official API.
//
// A Threads "chain" is a sequence of posts where each replies to the previous
// one. This posts them in order, threading them together, and attaches a single
// topic tag to the first post.
//
// Auth: an access token in THREADS_ACCESS_TOKEN (obtained via Meta OAuth) and
// the numeric THREADS_USER_ID. Tokens are read from the environment — never
// commit them.

const API = 'https://graph.threads.net/v1.0'
const MAX_LEN = 500 // Threads per-post character limit

interface PublishOptions {
  topicTag?: string
}

function config() {
  const accessToken = process.env.THREADS_ACCESS_TOKEN
  const userId = process.env.THREADS_USER_ID
  if (!accessToken || !userId) throw new Error('Set THREADS_ACCESS_TOKEN and THREADS_USER_ID')
  return { accessToken, userId }
}

async function createContainer(text: string, replyToId: string | undefined, topicTag: string | undefined): Promise<string> {
  const { accessToken, userId } = config()
  const params = new URLSearchParams({ media_type: 'TEXT', text: text.slice(0, MAX_LEN), access_token: accessToken })
  if (replyToId) params.set('reply_to_id', replyToId)
  if (topicTag) params.set('topic_tag', topicTag)

  const res = await fetch(`${API}/${userId}/threads`, { method: 'POST', body: params })
  const data = (await res.json()) as { id?: string; error?: { message: string } }
  if (!data.id) throw new Error(`create container failed: ${data.error?.message ?? 'unknown'}`)
  return data.id
}

async function publishContainer(containerId: string): Promise<string> {
  const { accessToken, userId } = config()
  const params = new URLSearchParams({ creation_id: containerId, access_token: accessToken })
  const res = await fetch(`${API}/${userId}/threads_publish`, { method: 'POST', body: params })
  const data = (await res.json()) as { id?: string; error?: { message: string } }
  if (!data.id) throw new Error(`publish failed: ${data.error?.message ?? 'unknown'}`)
  return data.id
}

/** Publish a chain of posts to Threads. Returns the published post IDs in order. */
export async function publishChain(posts: string[], opts: PublishOptions = {}): Promise<string[]> {
  const chain = posts.map((p) => p.trim()).filter(Boolean)
  if (chain.length === 0) throw new Error('Empty chain')

  const ids: string[] = []
  let replyToId: string | undefined
  for (let i = 0; i < chain.length; i++) {
    const topicTag = i === 0 ? opts.topicTag : undefined
    const containerId = await createContainer(chain[i], replyToId, topicTag)
    // Meta recommends a short pause between container creation and publish.
    await new Promise((r) => setTimeout(r, 1500))
    const postId = await publishContainer(containerId)
    ids.push(postId)
    replyToId = postId
  }
  return ids
}
