export function createCart() {
  return { items: [] }
}

export function addItem(cart, item, quantity = 1) {
  if (quantity <= 0) {
    throw new RangeError('quantity must be positive')
  }
  const found = cart.items.find(one => one.id === item.id)
  if (found) {
    return {
      items: cart.items.map(one =>
        one.id === item.id ? { ...one, quantity: one.quantity + quantity } : one,
      ),
    }
  }
  return { items: [...cart.items, { ...item, quantity }] }
}

export function removeItem(cart, id) {
  return { items: cart.items.filter(one => one.id !== id) }
}

export function changeQuantity(cart, id, quantity) {
  if (quantity <= 0) {
    return removeItem(cart, id)
  }
  return {
    items: cart.items.map(one => (one.id === id ? { ...one, quantity } : one)),
  }
}

export function countItems(cart) {
  return cart.items.reduce((sum, one) => sum + one.quantity, 0)
}

export function isEmpty(cart) {
  return cart.items.length === 0
}
