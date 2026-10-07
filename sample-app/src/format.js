export function formatYen(amount) {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function formatQuantity(quantity) {
  return `${quantity}点`
}

export function formatLine(item) {
  return `${item.name} × ${item.quantity}  ${formatYen(item.price * item.quantity)}`
}

export function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}
