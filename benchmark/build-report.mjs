import { readFileSync, writeFileSync } from 'node:fs'

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

const args = parseArgs(process.argv.slice(2))
const { baseline, current, template, out } = args

if (!baseline || !current || !template || !out) {
  console.error('usage: build-report.mjs --baseline <json> --current <json> --template <html> --out <html>')
  process.exit(1)
}

const baselineData = JSON.parse(readFileSync(baseline, 'utf8'))
const currentData = JSON.parse(readFileSync(current, 'utf8'))
const templateHtml = readFileSync(template, 'utf8')

const embed = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

const shim = `    <script>
      (function () {
        var embedded = {
          "baseline.json": ${embed(baselineData)},
          "current.json": ${embed(currentData)}
        };
        window.fetch = function (input) {
          var key = String(input).split("/").pop();
          if (Object.prototype.hasOwnProperty.call(embedded, key)) {
            return Promise.resolve(
              new Response(JSON.stringify(embedded[key]), {
                headers: { "Content-Type": "application/json" }
              })
            );
          }
          return Promise.reject(new Error("not embedded: " + key));
        };
      })();
    </script>
`

const marker = '</head>'
const idx = templateHtml.indexOf(marker)
if (idx === -1) {
  throw new Error('template is missing </head>')
}

const html = templateHtml.slice(0, idx) + shim + templateHtml.slice(idx)
writeFileSync(out, html)
console.log(`report written to: ${out}`)
