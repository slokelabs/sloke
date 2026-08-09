# Adapter contract

> **This is the contract.** Everything in sloke is built on it. If you're writing an
> adapter, this file is your spec. The TypeScript types in `packages/core` are the
> source of truth.

## Concept

An **adapter** is a module that can *execute a task*. sloke routes a `Task` to an adapter,
the adapter does the download, then reports status back so sloke can move the result and
notify the world.

## TypeScript shape

```ts
// packages/core/src/types.ts (normative)
export type TaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export interface Task {
  id: string
  type: TaskType            // 'bt' | 'direct' | 'rss' | 'ytdlp' | string
  source: string            // magnet / URL / feed URL / file path
  target: Target            // where the result should end up
  options?: Record<string, unknown>
  status: TaskStatus
  createdAt: number
  updatedAt: number
  error?: string
}

export interface Target {
  library: string           // 'books' | 'videos' | 'music' | ...
  category: string          // 'comics' | 'audiobooks' | 'podcasts' | ...
  filename?: string         // optional rename
}

export interface Adapter {
  id: string
  supportedTypes: TaskType[]
  /** Claim a task if you can handle it. Return false to skip. */
  canHandle(task: Task): boolean
  /** Execute the task. Resolve when done; throw to report failure. */
  execute(task: Task, ctx: AdapterContext): Promise<ExecutionResult>
}

export interface AdapterContext {
  /** Where sloke wants the final file(s) to live. */
  resolveTargetPath(target: Target): string
  /** Give the file the right ownership (e.g. PUID/PGID from config). */
  setOwnership(path: string): Promise<void>
  /** Report progress / completion for notifications & webhooks. */
  report(task: Task, event: string, data?: unknown): Promise<void>
}

export interface ExecutionResult {
  /** Absolute paths of files written. */
  paths: string[]
}
```

## Rules for a good adapter

1. **Adapters are self-contained.** Don't touch sloke internals beyond the context object.
2. **Idempotency is your friend.** If the target file already exists, say so — don't redownload.
3. **Respect the ownership config.** Always run `ctx.setOwnership` on written files so
   read-only consumer services can read them.
4. **Report.** Call `ctx.report` on progress and completion — bridges depend on it.

## Concurrency

sloke runs adapters in a bounded worker pool (configurable). Adapters should be safe to
run in parallel for *different* tasks; lock per-task if you must serialize.

## Example: the "direct" adapter

```ts
import { Adapter, Task, AdapterContext, ExecutionResult } from '@sloke/core'

export const directAdapter: Adapter = {
  id: 'direct',
  supportedTypes: ['direct'],
  canHandle: (task) => task.type === 'direct',
  async execute(task, ctx) {
    const dest = ctx.resolveTargetPath(task.target)
    const res = await fetch(task.source)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${task.source}`)
    await writeStream(res.body, dest)
    await ctx.setOwnership(dest)
    await ctx.report(task, 'completed', { path: dest })
    return { paths: [dest] }
  },
}
```

## Testing

Adapters should ship tests with a mocked `AdapterContext`. See
`packages/adapters/*/__tests__` for patterns.
