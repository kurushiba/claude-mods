// 3-5：はじめは fail-open のガード。BREAK を true にすると、わざとエラーを起こす。動画の後半で .catch を書き足して fail-closed にする
// （ガードが飛ばされて本当に強制プッシュされるので、リモートのない練習用フォルダで試す）
import type { Register } from 'claude-code'

const BREAK = false

export const register: Register = (on) => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (BREAK) {
      throw new Error('boom')
    }

    if (/git push .*--force/.test(e.command)) {
      return { deny: '強制プッシュは禁止です。新しいブランチにプッシュしてください' }
    }

    return next(e)
  })
}
