import { Database } from 'bun:sqlite'
import { createDirectAdapter, createQbtAdapter } from '@sloke/adapters'
import { createApp } from './app.ts'
import { sqliteStore } from './daemon.ts'

const db = new Database(process.env.SLOKE_DB ?? 'sloke.db')
const store = sqliteStore(db)

const adapters = [
  createDirectAdapter(),
  ...(process.env.QBT_URL
    ? [
        createQbtAdapter({
          baseUrl: process.env.QBT_URL,
          username: process.env.QBT_USER ?? 'admin',
          password: process.env.QBT_PASS ?? '',
          category: process.env.QBT_CATEGORY,
        }),
      ]
    : []),
]

const app = createApp({ adapters, store })

const port = Number(process.env.SLOKE_PORT ?? 3939)

export default {
  port,
  fetch: app.fetch,
}

console.log(`sloke daemon listening on :${port} (${adapters.map((a) => a.id).join(', ')})`)
