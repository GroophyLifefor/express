import express from '../index.js'
import { dispatch } from './support.mjs'

function noop (req, res, next) {
  next()
}

function createApp () {
  const app = express()

  // a realistic spread of static, parameterised and nested routes
  const resources = ['users', 'posts', 'comments', 'orders', 'products',
    'invoices', 'teams', 'projects', 'tickets', 'reports']

  resources.forEach(function (name) {
    app.get('/api/' + name, function (req, res) { res.send(name) })
    app.post('/api/' + name, function (req, res) { res.status(201).send(name) })
    app.get('/api/' + name + '/:id', function (req, res) { res.send(req.params.id) })
    app.put('/api/' + name + '/:id', function (req, res) { res.send(req.params.id) })
    app.delete('/api/' + name + '/:id', function (req, res) { res.sendStatus(204) })
  })

  const router = express.Router()
  router.get('/:org/repos/:repo/issues/:number', function (req, res) {
    res.send(req.params.org + '/' + req.params.repo + '#' + req.params.number)
  })
  app.use('/v2', router)

  app.get('/static/*path', function (req, res) { res.send(req.params.path.join('/')) })

  return app
}

function createMiddlewareApp (count) {
  const app = express()
  for (let i = 0; i < count; i++) {
    app.use(noop)
  }
  app.get('/', function (req, res) { res.send('ok') })
  return app
}

const app = createApp()
const middlewareApp = createMiddlewareApp(20)

export default function register (bench) {
  bench
    .add('first static route', async function () {
      await dispatch(app, { url: '/api/users' })
    })
    .add('last static route', async function () {
      await dispatch(app, { url: '/api/reports' })
    })
    .add('route with param', async function () {
      await dispatch(app, { url: '/api/orders/12345' })
    })
    .add('DELETE route with param', async function () {
      await dispatch(app, { method: 'DELETE', url: '/api/tickets/987' })
    })
    .add('nested router with multiple params', async function () {
      await dispatch(app, { url: '/v2/expressjs/repos/express/issues/42' })
    })
    .add('wildcard route', async function () {
      await dispatch(app, { url: '/static/css/vendor/app.min.css' })
    })
    .add('route not found (404)', async function () {
      await dispatch(app, { url: '/does/not/exist', finalhandler: true })
    })
    .add('20 middleware before handler', async function () {
      await dispatch(middlewareApp, { url: '/' })
    })
    .add('create app with 50 routes', function () {
      createApp()
    })
}
