#!/usr/bin/env bun
import { createTask } from '@sloke/core'

const args = process.argv.slice(2)
const [cmd] = args

switch (cmd) {
  case 'init':
    console.log('sloke init: writing config (placeholder)')
    break
  case 'task': {
    const source = args[1]
    if (!source) {
      console.error('usage: sloke task add <source>')
      process.exit(1)
    }
    const task = createTask({
      type: 'direct',
      source,
      target: { library: 'books', category: 'downloads' },
    })
    console.log(`queued ${task.id}`)
    break
  }
  default:
    console.log('sloke — self-hosted download orchestration')
    console.log('usage: sloke init | sloke task add <source>')
}
