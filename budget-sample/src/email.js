import { formatPrice } from './utils/price.js'

export function orderConfirmation(order) {
  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return `${order.customer} 様\n\nご注文ありがとうございます。\nご請求額は ${formatPrice(total, order.currency)} です。`
}
