import { readFileSync } from 'node:fs'

function parseArgs (argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      args[arg.slice(2)] = argv[++i]
    }
  }
  return args
}

const { baseline, current } = parseArgs(process.argv.slice(2))
if (!baseline || !current) {
  console.error('usage: compare-table.mjs --baseline <json> --current <json>')
  process.exit(1)
}

const base = JSON.parse(readFileSync(baseline, 'utf8')).clientResults[0]
const head = JSON.parse(readFileSync(current, 'utf8')).clientResults[0]

const fmtInt = (n) => Math.round(n).toLocaleString('en-US')
const fmtNum = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const mbps = (bytesPerSec) => `${fmtNum(bytesPerSec / 1e6)} MB/s`
const ms = (v) => `${fmtNum(v)} ms`
const errorsOf = (r) => (r.errors || 0) + (r.timeouts || 0)

function pct (b, h) {
  if (!b) return null
  return ((h - b) / b) * 100
}

function deltaCell (p, higherIsBetter) {
  if (p === null) return '—'
  const sign = p > 0 ? '+' : p < 0 ? '−' : ''
  const text = `${sign}${Math.abs(p).toFixed(1)}%`
  const bad = higherIsBetter ? p < 0 : p > 0
  return bad ? `**${text}**` : text
}

const rows = [
  ['Requests/sec (avg)', fmtNum(base.requests.average), fmtNum(head.requests.average), pct(base.requests.average, head.requests.average), true],
  ['Throughput (avg)', mbps(base.throughput.average), mbps(head.throughput.average), pct(base.throughput.average, head.throughput.average), true],
  ['Latency avg', ms(base.latency.average), ms(head.latency.average), pct(base.latency.average, head.latency.average), false],
  ['Latency p50', ms(base.latency.p50), ms(head.latency.p50), pct(base.latency.p50, head.latency.p50), false],
  ['Latency p99', ms(base.latency.p99), ms(head.latency.p99), pct(base.latency.p99, head.latency.p99), false],
  ['2xx responses', fmtInt(base['2xx'] || 0), fmtInt(head['2xx'] || 0), pct(base['2xx'] || 0, head['2xx'] || 0), true],
  ['Errors / timeouts', fmtInt(errorsOf(base)), fmtInt(errorsOf(head)), pct(errorsOf(base), errorsOf(head)), false]
]

const rpsDelta = pct(base.requests.average, head.requests.average)
let verdict = 'Stable'
if (rpsDelta !== null) {
  if (rpsDelta <= -2) {
    verdict = `Regression detected — head is ${Math.abs(rpsDelta).toFixed(1)}% slower (req/s).`
  } else if (rpsDelta >= 2) {
    verdict = `Improvement — head is ${rpsDelta.toFixed(1)}% faster (req/s).`
  }
}

const lines = [
  `**${verdict}**`,
  '',
  '| Metric | base | head | Δ |',
  '|---|---:|---:|---:|'
]
for (const [name, b, h, p, higherIsBetter] of rows) {
  lines.push(`| ${name} | ${b} | ${h} | ${deltaCell(p, higherIsBetter)} |`)
}

process.stdout.write(lines.join('\n') + '\n')
