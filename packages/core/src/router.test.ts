import { describe, expect, it, mock } from 'bun:test'

import { createTask, TaskRouter } from './router.ts'
import type { Adapter, AdapterContext, Target } from './types.ts'

function fakeCtx(): AdapterContext {
  return {
    resolveTargetPath: (t: Target) => `/media/${t.library}/${t.category}`,
    setOwnership: mock(async () => {}),
    report: mock(async () => {}),
  }
}

describe('createTask', () => {
  it('assigns id, status queued, and timestamps', () => {
    const task = createTask({
      type: 'bt',
      source: 'magnet:x',
      target: { library: 'books', category: 'comics' },
    })
    expect(task.id).toMatch(/^task_/)
    expect(task.status).toBe('queued')
    expect(task.createdAt).toBeGreaterThan(0)
    expect(task.updatedAt).toBeGreaterThan(0)
  })
})

describe('TaskRouter', () => {
  it('dispatches to the first adapter that can handle the task', async () => {
    const execute = mock(async () => ({ paths: ['/media/books/comics/x.cbz'] }))
    const adapter: Adapter = {
      id: 'qbt',
      supportedTypes: ['bt'],
      canHandle: () => true,
      execute,
    }
    const router = new TaskRouter({ adapters: [adapter] })
    const task = createTask({
      type: 'bt',
      source: 'magnet:x',
      target: { library: 'books', category: 'comics' },
    })

    const result = await router.dispatch(task, fakeCtx())
    expect(execute).toHaveBeenCalled()
    expect(execute).toHaveBeenCalledTimes(1)
    expect(result.paths).toEqual(['/media/books/comics/x.cbz'])
  })

  it('emits started then completed events', async () => {
    const events: string[] = []
    const adapter: Adapter = {
      id: 'a',
      supportedTypes: ['x'],
      canHandle: () => true,
      execute: async () => ({ paths: [] }),
    }
    const router = new TaskRouter({
      adapters: [adapter],
      onEvent: (e) => events.push(e.event),
    })
    const task = createTask({ type: 'x', source: 's', target: { library: 'l', category: 'c' } })

    await router.dispatch(task, fakeCtx())
    expect(events).toEqual(['task.started', 'task.completed'])
  })

  it('throws when no adapter can handle the task', async () => {
    const router = new TaskRouter({ adapters: [] })
    const task = createTask({ type: 'unknown', source: 's', target: { library: 'l', category: 'c' } })
    await expect(router.dispatch(task, fakeCtx())).rejects.toThrow(/No adapter/)
  })
})
