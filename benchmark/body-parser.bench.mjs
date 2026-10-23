import express from '../index.js'
import { dispatch } from './support.mjs'

const smallJson = JSON.stringify({ username: 'tj', password: 'secret', remember: true })

const largeJson = JSON.stringify({
  events: Array.from({ length: 100 }, function (_, i) {
    return { id: i, type: 'click', target: '#button-' + i, ts: 1700000000000 + i, meta: { x: i, y: i * 2 } }
  })
})

const urlencoded = 'user[name]=tj&user[email]=tj%40example.com&tags[]=a&tags[]=b&tags[]=c' +
  '&address[city]=Paris&address[zip]=75001&message=hello+world'

const text = 'plain text payload '.repeat(50)

const app = express()
app.post('/json', express.json(), function (req, res) { res.end() })
app.post('/urlencoded', express.urlencoded({ extended: true }), function (req, res) { res.end() })
app.post('/text', express.text(), function (req, res) { res.end() })
app.post('/raw', express.raw(), function (req, res) { res.end() })

export default function register (bench) {
  bench
    .add('express.json small payload', async function () {
      await dispatch(app, {
        method: 'POST',
        url: '/json',
        headers: { 'content-type': 'application/json' },
        body: smallJson
      })
    })
    .add('express.json large payload', async function () {
      await dispatch(app, {
        method: 'POST',
        url: '/json',
        headers: { 'content-type': 'application/json' },
        body: largeJson
      })
    })
    .add('express.urlencoded extended', async function () {
      await dispatch(app, {
        method: 'POST',
        url: '/urlencoded',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: urlencoded
      })
    })
    .add('express.text', async function () {
      await dispatch(app, {
        method: 'POST',
        url: '/text',
        headers: { 'content-type': 'text/plain' },
        body: text
      })
    })
    .add('express.raw', async function () {
      await dispatch(app, {
        method: 'POST',
        url: '/raw',
        headers: { 'content-type': 'application/octet-stream' },
        body: text
      })
    })
}
