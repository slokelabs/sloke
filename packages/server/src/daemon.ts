import type { Database } from 'bun:sqlite'
import type { Adapter, Target, Task } from '@sloke/core'
import { createTask, setTaskStatus, TaskRouter } from '@sloke/core'

export interface Store {
  insert(task: Task): void
  get(id: string): Task | undefined
  list(status?: string): Task[]
  update(task: Task): void
}

export function sqliteStore(db: Database): Store {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    options TEXT,
    status TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    error TEXT
  )`)

  interface TaskRow {
    id: string
    type: string
    source: string
    target: string
    options: string | null
    status: string
    createdAt: number
    updatedAt: number
    error: string | null
  }

  const rowToTask = (row: TaskRow): Task => ({
    id: row.id,
    type: row.type,
    source: row.source,
    target: JSON.parse(row.target) as Target,
    options: row.options ? (JSON.parse(row.options) as Record<string, unknown>) : undefined,
    status: row.status as Task['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    error: row.error ?? undefined,
  })

  return {
    insert(task) {
      db.run(
        `INSERT INTO tasks (id, type, source, target, options, status, createdAt, updatedAt, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.type,
          task.source,
          JSON.stringify(task.target),
          task.options ? JSON.stringify(task.options) : null,
          task.status,
          task.createdAt,
          task.updatedAt,
          task.error ?? null,
        ]
      )
    },
    get(id) {
      const row = db.query('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined
      return row ? rowToTask(row) : undefined
    },
    list(status) {
      const rows = status
        ? db.query('SELECT * FROM tasks WHERE status = ?').all(status)
        : db.query('SELECT * FROM tasks').all()
      return (rows as TaskRow[]).map(rowToTask)
    },
    update(task) {
      db.run(`UPDATE tasks SET status = ?, error = ?, updatedAt = ? WHERE id = ?`, [
        task.status,
        task.error ?? null,
        task.updatedAt,
        task.id,
      ])
    },
  }
}

export function createDaemon(options: { adapters: Adapter[]; store: Store }) {
  const router = new TaskRouter({
    adapters: options.adapters,
    onEvent: (event) => {
      if (event.event === 'task.started') {
        const t = event.task
        options.store.update(setTaskStatus(t, 'running'))
      } else if (event.event === 'task.completed') {
        const t = event.task
        options.store.update(setTaskStatus(t, 'succeeded'))
      } else if (event.event === 'task.failed') {
        const t = event.task
        options.store.update(setTaskStatus(t, 'failed', t.error))
      }
    },
  })

  return {
    router,
    submit(input: { type: string; source: string; target: Target; options?: Record<string, unknown> }): Task {
      const task = createTask(input)
      options.store.insert(task)
      options.store.update(setTaskStatus(task, 'queued'))
      return task
    },
  }
}

export type { Task }
