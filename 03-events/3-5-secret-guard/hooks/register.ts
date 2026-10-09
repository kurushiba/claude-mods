// 3-5：はじめは fail-open のガード。BREAK を true にすると、わざとエラーを起こす。動画の後半で .catch を書き足して fail-closed にする
import type { Register } from 'claude-code'

const BREAK = false

export const register: Register = (on) => {
  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    if (BREAK) {
      throw new Error('boom')
    }

    if (e.file_path.endsWith('secret.txt')) {
      return { deny: 'secret.txt は読めません。中身が必要なら、ユーザーに聞いてください' }
    }

    return next(e)
  })
}
