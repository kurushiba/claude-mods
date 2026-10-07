// src/ と test/ の変更を見張り、変わるたびに npm test と同じテストを走らせる。
// 1回の実行が終わるごとに、最後に「[watch-tests] finished exit=<終了コード>」の1行を出す
// （Test Pilot はこの行を目印に、1回分の結果を区切って読み取る）。
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'

const WATCHED = ['src', 'test']
const QUIET_MS = 300

let timer = null
let isRunning = false
let isQueued = false

function run() {
  if (isRunning) {
    isQueued = true
    return
  }
  isRunning = true
  const child = spawn(process.execPath, ['--test', '--test-reporter=spec'], { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.pipe(process.stdout, { end: false })
  child.stderr.pipe(process.stderr, { end: false })
  child.on('close', code => {
    process.stdout.write(`[watch-tests] finished exit=${code ?? 1}\n`)
    isRunning = false
    if (isQueued) {
      isQueued = false
      run()
    }
  })
}

for (const dir of WATCHED) {
  watch(dir, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(run, QUIET_MS)
  })
}

run()
