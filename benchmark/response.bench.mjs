import express from '../index.js'
import { dispatch } from './support.mjs'

const smallObject = { id: 1, name: 'express', active: true }

const largeObject = {
  items: Array.from({ length: 200 }, function (_, i) {
    return {
      id: i,
      name: 'item-' + i,
      tags: ['alpha', 'beta', 'gamma'],
      price: i * 1.5,
      nested: { createdAt: '2024-01-01T00:00:00.000Z', enabled: i % 2 === 0 }
    }
  })
}

const largeText = 'lorem ipsum dolor sit amet '.repeat(400)

const app = express()

app.get('/json/small', function (req, res) { res.json(smallObject) })
app.get('/json/large', function (req, res) { res.json(largeObject) })
app.get('/jsonp', function (req, res) { res.jsonp(smallObject) })
app.get('/send/html', function (req, res) { res.send('<p>Hello, World!</p>') })
app.get('/send/large', function (req, res) { res.send(largeText) })
app.get('/send/status', function (req, res) { res.sendStatus(204) })
app.get('/redirect', function (req, res) { res.redirect('/login?next=%2Fdashboard') })

app.get('/headers', function (req, res) {
  res.set({
    'Cache-Control': 'no-cache',
    'X-Request-Id': 'abc-123',
    'X-Frame-Options': 'DENY'
  })
  res.append('Link', ['<http://localhost/>', '<http://localhost:3000/>'])
  res.vary('Accept-Encoding')
  res.type('json')
  res.send('{}')
})

app.get('/cookies', function (req, res) {
  res.cookie('session', 'abcdef0123456789', { httpOnly: true, maxAge: 3600000, path: '/' })
  res.cookie('prefs', { theme: 'dark', lang: 'en' }, { sameSite: 'lax' })
  res.clearCookie('legacy')
  res.end()
})

app.get('/format', function (req, res) {
  res.format({
    'text/plain': function () { res.send('hello') },
    'text/html': function () { res.send('<p>hello</p>') },
    'application/json': function () { res.json({ message: 'hello' }) }
  })
})

export default function register (bench) {
  bench
    .add('res.json small object', async function () {
      await dispatch(app, { url: '/json/small' })
    })
    .add('res.json large object', async function () {
      await dispatch(app, { url: '/json/large' })
    })
    .add('res.jsonp with callback', async function () {
      await dispatch(app, { url: '/jsonp?callback=handle' })
    })
    .add('res.send html string', async function () {
      await dispatch(app, { url: '/send/html' })
    })
    .add('res.send large string (etag)', async function () {
      await dispatch(app, { url: '/send/large' })
    })
    .add('res.send fresh request (304)', async function () {
      await dispatch(app, {
        url: '/send/html',
        headers: { 'if-none-match': 'W/"14-UEgmxq84YB3jUrvPtCv95CaXyYs"' }
      })
    })
    .add('res.sendStatus', async function () {
      await dispatch(app, { url: '/send/status' })
    })
    .add('res.redirect', async function () {
      await dispatch(app, { url: '/redirect', headers: { accept: 'text/html' } })
    })
    .add('res.set / append / vary / type', async function () {
      await dispatch(app, { url: '/headers' })
    })
    .add('res.cookie / clearCookie', async function () {
      await dispatch(app, { url: '/cookies' })
    })
    .add('res.format content negotiation', async function () {
      await dispatch(app, {
        url: '/format',
        headers: { accept: 'application/json;q=0.9, text/html;q=0.8, */*;q=0.1' }
      })
    })
}
