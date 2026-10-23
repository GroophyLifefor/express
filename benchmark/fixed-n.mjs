import autocannon from 'autocannon'
import express from '../index.js'

const amount = Number.parseInt(process.env.BENCH_REQUESTS ?? '10000', 10)
const connections = Number.parseInt(process.env.BENCH_CONNECTIONS ?? '50', 10)

const app = express()

app.get('/', (req, res) => {
  res.json({ hello: 'world' })
})

const server = app.listen(0)

await new Promise((resolve, reject) => {
  server.once('listening', resolve)
  server.once('error', reject)
})

const { port } = server.address()

const result = await new Promise((resolve, reject) => {
  autocannon({ url: `http://127.0.0.1:${port}/`, connections, amount }, (err, res) => {
    if (err) {
      reject(err)
    } else {
      resolve(res)
    }
  })
})

await new Promise((resolve) => server.close(resolve))

process.stdout.write(JSON.stringify({
  requestsPerSec: result.requests.average,
  latencyMs: result.latency.average
}) + '\n')
