import type { Adapter, AdapterContext, ExecutionResult, Task, TaskStatus } from './types.ts'

export type TaskEvent =
  | { event: 'task.queued'; task: Task }
  | { event: 'task.started'; task: Task }
  | { event: 'task.completed'; task: Task; data?: { paths: string[] } }
  | { event: 'task.failed'; task: Task; data?: { error: string } }
  | { event: 'task.cancelled'; task: Task }

export type TaskEventListener = (event: TaskEvent) => void

export interface RouterOptions {
  adapters: Adapter[]
  onEvent?: TaskEventListener
}

export class TaskRouter {
  private readonly adapters: Adapter[]
  private readonly onEvent?: TaskEventListener

  constructor(options: RouterOptions) {
    this.adapters = options.adapters
    this.onEvent = options.onEvent
  }

  async dispatch(task: Task, ctx: AdapterContext): Promise<ExecutionResult> {
    const adapter = this.adapters.find((a) => a.canHandle(task))
    if (!adapter) {
      throw new Error(`No adapter can handle task type "${task.type}"`)
    }

    this.emit({ event: 'task.started', task })
    try {
      const result = await adapter.execute(task, ctx)
      this.emit({ event: 'task.completed', task, data: { paths: result.paths } })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.emit({ event: 'task.failed', task, data: { error: message } })
      throw error
    }
  }

  adaptersFor(type: string): Adapter[] {
    return this.adapters.filter((a) => a.supportedTypes.includes(type))
  }

  private emit(event: TaskEvent): void {
    this.onEvent?.(event)
  }
}

export function createTask(partial: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Task {
  const now = Date.now()
  return {
    ...partial,
    id: `task_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  }
}

export function setTaskStatus(task: Task, status: TaskStatus, error?: string): Task {
  task.status = status
  task.error = error
  task.updatedAt = Date.now()
  return task
}
