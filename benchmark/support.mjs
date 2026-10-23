import http from 'node:http'
import { Buffer } from 'node:buffer'
import { Duplex } from 'node:stream'

/**
 * Minimal socket stand-in so requests can be dispatched through an
 * Express app fully in-process, without opening a network connection.
 */
function createSocket () {
  const socket = new Duplex({
    read () {},
    write (chunk, encoding, callback) { callback() }
  })
  socket.encrypted = false
  socket.remoteAddress = '127.0.0.1'
  socket.remotePort = 54321
  return socket
}

/**
 * Dispatch a single fake request through `app` and resolve with the
 * response once `res.end()` has been called.
 *
 * @param {Function} app express application
 * @param {object} options
 * @param {string} [options.method]
 * @param {string} [options.url]
 * @param {object} [options.headers]
 * @param {string|Buffer} [options.body]
 * @param {boolean} [options.finalhandler] let Express' final handler respond
 *   (e.g. 404) instead of rejecting when no route handles the request
 * @return {Promise<http.ServerResponse>}
 */
export function dispatch (app, options) {
  const opts = options || {}
  const socket = createSocket()
  const req = new http.IncomingMessage(socket)
  req.method = opts.method || 'GET'
  req.url = opts.url || '/'
  req.headers = Object.assign({ host: 'localhost' }, opts.headers)
  req.httpVersionMajor = 1
  req.httpVersionMinor = 1
  req.httpVersion = '1.1'

  if (opts.body !== undefined) {
    const body = Buffer.isBuffer(opts.body) ? opts.body : Buffer.from(opts.body)
    req.headers['content-length'] = String(body.length)
    req.push(body)
  }
  req.push(null)

  const res = new http.ServerResponse(req)

  return new Promise(function (resolve, reject) {
    const end = res.end
    res.end = function () {
      end.apply(this, arguments)
      resolve(res)
      return this
    }
    if (opts.finalhandler) {
      app(req, res)
      return
    }
    app(req, res, function (err) {
      if (err) return reject(err)
      reject(new Error('request was not handled: ' + req.method + ' ' + req.url))
    })
  })
}
