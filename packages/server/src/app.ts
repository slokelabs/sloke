import { Database } from 'bun:sqlite'
import type { Adapter, Target } from '@sloke/core'
import { Hono } from 'hono'
import type { Store } from './daemon.ts'
import { createDaemon, sqliteStore } from './daemon.ts'

export function createApp(options: { adapters: Adapter[]; store?: Store }) {
  const store = options.store ?? sqliteStore(new Database(':memory:'))
  const daemon = createDaemon({ adapters: options.adapters, store })

  const app = new Hono()

  app.get('/healthz', (c) => c.json({ status: 'ok' }))

  app.get('/api/adapters', (c) => {
    const adapters = options.adapters.map((a) => ({ id: a.id, supportedTypes: a.supportedTypes }))
    return c.json({ adapters })
  })

  app.post('/api/tasks', async (c) => {
    const body = await c.req.json<{
      type?: string
      source?: string
      target?: Target
      options?: Record<string, unknown>
    }>()
    if (!body.type || !body.source || !body.target) {
      return c.json({ error: 'type, source, and target are required' }, 400)
    }
    const task = daemon.submit({ type: body.type, source: body.source, target: body.target, options: body.options })
    return c.json(task, 201)
  })

  app.get('/api/tasks', (c) => {
    const status = c.req.query('status')
    const tasks = store.list(status)
    return c.json(tasks)
  })

  app.get('/api/tasks/:id', (c) => {
    const task = store.get(c.req.param('id'))
    if (!task) return c.json({ error: 'not found' }, 404)
    return c.json(task)
  })

  return app
}
