// Shared types for the multi-agent pipeline.

/** A single unit of planned content the writer will turn into a post/thread. */
export interface PlannedSlot {
  /** Free-form theme/brief for this slot. */
  theme: string
  /** Post type — steer the writer (e.g. "useful", "opinion", "story"). */
  type: string
}

/** The writer's output: a Threads chain (1..N connected posts) + a topic tag. */
export interface WrittenPost {
  /** Each element is one post in the chain (hook → body → ...). */
  thread: string[]
  /** Single Threads topic tag for the whole chain. */
  topic: string
}

/** The reviewer's verdict on a draft. */
export interface Review {
  approved: boolean
  /** Concrete issues to fix if not approved. */
  issues: string[]
  /** Optional already-fixed version so the pipeline can skip another round. */
  fixed?: string[]
}
