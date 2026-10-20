import { formatPrice } from './utils/price.js'

export function receipt(payment) {
  const { amount, currency, method } = payment
  return [`お支払い方法: ${method}`, `お支払い金額: ${formatPrice(amount, currency)}`].join('\n')
}
