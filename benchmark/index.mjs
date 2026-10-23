import { Bench } from 'tinybench'
import { withCodSpeed } from '@codspeed/tinybench-plugin'

import express from '../index.js'
import { dispatch } from './support.mjs'
import registerBodyParser from './body-parser.bench.mjs'
import registerRequest from './request.bench.mjs'
import registerResponse from './response.bench.mjs'
import registerRouting from './routing.bench.mjs'

const bench = withCodSpeed(new Bench({ name: 'express' }))

registerRouting(bench)
registerRequest(bench)
registerResponse(bench)
registerBodyParser(bench)

// warm up one-time lazy initialization in Node's http stack and Express
// so it is not attributed to whichever benchmark happens to run first
const warmupApp = express()
warmupApp.get('/', function (req, res) { res.json({ ok: true }) })
for (let i = 0; i < 10; i++) {
  await dispatch(warmupApp, { url: '/' })
}

await bench.run()

console.table(bench.table())

// fail loudly if any benchmark threw instead of silently reporting it
const failed = bench.tasks.filter(function (task) {
  return task.result && task.result.state === 'errored'
})

if (failed.length > 0) {
  failed.forEach(function (task) {
    console.error(task.name, task.result.error)
  })
  process.exitCode = 1
}
