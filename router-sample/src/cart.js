import { formatPrice } from './utils/price.js'

export function cartSummary(items, currency) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return `合計 ${formatPrice(total, currency)}（${items.length}品目）`
}
