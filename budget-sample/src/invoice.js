import { formatPrice } from './utils/price.js'

export function invoiceLines(order) {
  return order.items.map(item => `${item.name}\t${formatPrice(item.price * item.quantity, order.currency)}`)
}

export function invoiceTotal(order) {
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return formatPrice(total, order.currency)
}
