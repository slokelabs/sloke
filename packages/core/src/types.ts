export type TaskType = string

export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export interface Target {
  library: string
  category: string
  filename?: string
}

export interface Task {
  id: string
  type: TaskType
  source: string
  target: Target
  options?: Record<string, unknown>
  status: TaskStatus
  createdAt: number
  updatedAt: number
  error?: string
}

export interface ExecutionResult {
  paths: string[]
}

export interface AdapterContext {
  resolveTargetPath(target: Target): string
  setOwnership(path: string): Promise<void>
  report(task: Task, event: string, data?: unknown): Promise<void>
}

export interface Adapter {
  id: string
  supportedTypes: TaskType[]
  canHandle(task: Task): boolean
  execute(task: Task, ctx: AdapterContext): Promise<ExecutionResult>
}
