import { cartSummary } from './cart.js'
import { invoiceTotal } from './invoice.js'
import { receipt } from './receipt.js'

const order = {
  customer: '山田',
  currency: 'USD',
  items: [
    { name: 'Notebook', price: 4.5, quantity: 2 },
    { name: 'Pen', price: 1.2, quantity: 3 },
  ],
}

console.log(cartSummary(order.items, order.currency))
console.log(invoiceTotal(order))
console.log(receipt({ amount: 12.6, currency: order.currency, method: 'カード' }))
