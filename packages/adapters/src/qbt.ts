import type { Adapter, ExecutionResult, Task } from '@sloke/core'

export interface QbtOptions {
  baseUrl: string
  username: string
  password: string
  /** qBittorrent category or save path override */
  category?: string
  savePath?: string
}

export function createQbtAdapter(options: QbtOptions): Adapter {
  let cookie = ''

  async function login(): Promise<void> {
    const res = await fetch(`${options.baseUrl}/api/v2/auth/login`, {
      method: 'POST',
      body: new URLSearchParams({ username: options.username, password: options.password }),
    })
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) cookie = setCookie.split(';')[0] ?? ''
    if (!res.ok) throw new Error(`qBittorrent login failed: ${res.status}`)
  }

  async function authed(path: string, init?: RequestInit): Promise<Response> {
    if (!cookie) await login()
    const res = await fetch(`${options.baseUrl}${path}`, {
      ...init,
      headers: { Cookie: cookie, ...(init?.headers ?? {}) },
    })
    if (res.status === 403) {
      await login()
      return fetch(`${options.baseUrl}${path}`, {
        ...init,
        headers: { Cookie: cookie, ...(init?.headers ?? {}) },
      })
    }
    return res
  }

  async function addTorrent(task: Task): Promise<void> {
    const form = new FormData()
    const urls = task.source
    form.set('urls', urls)
    if (options.category) form.set('category', options.category)
    if (options.savePath) form.set('savepath', options.savePath)
    const res = await authed('/api/v2/torrents/add', { method: 'POST', body: form })
    if (!res.ok) throw new Error(`qBittorrent add failed: ${res.status}`)
  }

  return {
    id: 'qbt',
    supportedTypes: ['bt'],
    canHandle: (task) => task.type === 'bt',
    async execute(task, ctx): Promise<ExecutionResult> {
      await addTorrent(task)
      await ctx.report(task, 'qbt.added', { magnet: task.source })
      // Torrents download asynchronously in qBittorrent; we report the handoff.
      return { paths: [] }
    },
  }
}
