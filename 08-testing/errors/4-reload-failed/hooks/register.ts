// 8-3④：Claude Code を起動したまま、下の (BROKEN) の行のコメント記号 // を消して保存すると
//   reload failed, the previous version stays loaded
// と出て、直前の動いていた版がそのまま動き続ける（2-5 の復習）。// を戻して保存すれば直る
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('tool.call', async ($, e, next) => {
    $.ui.log(`tool: ${e.tool}`)
    // (BROKEN) return next(e
    return next(e)
  })
}
