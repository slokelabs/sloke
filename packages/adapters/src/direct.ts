import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import type { Adapter, ExecutionResult } from '@sloke/core'

export interface DirectOptions {
  headers?: Record<string, string>
  /** max bytes before aborting */
  maxBytes?: number
}

export function createDirectAdapter(options: DirectOptions = {}): Adapter {
  return {
    id: 'direct',
    supportedTypes: ['direct'],
    canHandle: (task) => task.type === 'direct',
    async execute(task, ctx): Promise<ExecutionResult> {
      const dest = ctx.resolveTargetPath(task.target)
      await mkdir(dirname(dest), { recursive: true })

      const res = await fetch(task.source, { headers: options.headers })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${task.source}`)

      const ext = extname(new URL(task.source).pathname) || '.bin'
      const outPath = dest.endsWith('/') ? `${dest}${task.id}${ext}` : dest

      const buffer = Buffer.from(await res.arrayBuffer())
      if (options.maxBytes && buffer.byteLength > options.maxBytes) {
        throw new Error(`file too large: ${buffer.byteLength} > ${options.maxBytes}`)
      }

      await writeFile(outPath, buffer)
      await ctx.setOwnership(outPath)
      await ctx.report(task, 'direct.downloaded', { path: outPath, bytes: buffer.byteLength })
      return { paths: [outPath] }
    },
  }
}
