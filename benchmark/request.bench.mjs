import express from '../index.js'
import { dispatch } from './support.mjs'

const browserHeaders = {
  host: 'api.example.com:8080',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
  'accept-encoding': 'gzip, deflate, br',
  'accept-charset': 'utf-8, iso-8859-1;q=0.5',
  'content-type': 'application/json; charset=utf-8',
  'x-requested-with': 'XMLHttpRequest',
  'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
  'x-forwarded-proto': 'https',
  'x-forwarded-host': 'www.example.com'
}

const app = express()
app.set('trust proxy', true)

app.get('/inspect', function (req, res) {
  const out = {
    accepts: req.accepts(['json', 'html']),
    charset: req.acceptsCharsets('utf-8'),
    encoding: req.acceptsEncodings('br', 'gzip'),
    language: req.acceptsLanguages('fr', 'en'),
    is: req.is('json'),
    type: req.get('Content-Type'),
    protocol: req.protocol,
    secure: req.secure,
    ip: req.ip,
    ips: req.ips,
    host: req.host,
    hostname: req.hostname,
    subdomains: req.subdomains,
    path: req.path,
    xhr: req.xhr
  }
  res.end(String(Object.keys(out).length))
})

app.get('/query', function (req, res) {
  res.end(String(Object.keys(req.query).length))
})

const simpleApp = express()
simpleApp.set('query parser', 'simple')
simpleApp.get('/query', function (req, res) {
  res.end(String(Object.keys(req.query).length))
})

const nestedQuery = '/query?user[name]=tj&user[email]=tj@example.com' +
  '&filter[status][]=open&filter[status][]=closed&sort=-created&page[size]=50&page[number]=3'
const flatQuery = '/query?q=express&limit=25&offset=100&sort=desc&lang=en&utm_source=bench'

export default function register (bench) {
  bench
    .add('req accessors (accepts, ip, host, protocol, ...)', async function () {
      await dispatch(app, { url: '/inspect', headers: browserHeaders })
    })
    .add('extended query parser (nested)', async function () {
      await dispatch(app, { url: nestedQuery })
    })
    .add('extended query parser (flat)', async function () {
      await dispatch(app, { url: flatQuery })
    })
    .add('simple query parser (flat)', async function () {
      await dispatch(simpleApp, { url: flatQuery })
    })
}
