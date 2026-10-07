import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { addItem, changeQuantity, countItems, createCart, isEmpty, removeItem } from '../src/cart.js'

const apple = { id: 'apple', name: 'りんご', price: 150 }
const pear = { id: 'pear', name: 'なし', price: 200 }

describe('createCart', () => {
  it('starts empty', () => assert.equal(isEmpty(createCart()), true))
  it('has no items', () => assert.deepEqual(createCart().items, []))
})

describe('addItem', () => {
  it('adds a new item', () => assert.equal(addItem(createCart(), apple).items.length, 1))
  it('adds quantity 1 by default', () => assert.equal(addItem(createCart(), apple).items[0].quantity, 1))
  it('merges the same item', () => {
    const cart = addItem(addItem(createCart(), apple, 2), apple, 3)
    assert.equal(cart.items[0].quantity, 5)
  })
  it('keeps different items apart', () => {
    const cart = addItem(addItem(createCart(), apple), pear)
    assert.equal(cart.items.length, 2)
  })
  it('rejects zero quantity', () => assert.throws(() => addItem(createCart(), apple, 0), RangeError))
  it('does not change the original cart', () => {
    const cart = createCart()
    addItem(cart, apple)
    assert.equal(isEmpty(cart), true)
  })
})

describe('removeItem and changeQuantity', () => {
  it('removes an item', () => assert.equal(isEmpty(removeItem(addItem(createCart(), apple), 'apple')), true))
  it('changes quantity', () => {
    const cart = changeQuantity(addItem(createCart(), apple), 'apple', 4)
    assert.equal(countItems(cart), 4)
  })
  it('removes the item at quantity 0', () => {
    const cart = changeQuantity(addItem(createCart(), apple), 'apple', 0)
    assert.equal(isEmpty(cart), true)
  })
  it('counts every quantity', () => {
    const cart = addItem(addItem(createCart(), apple, 2), pear, 3)
    assert.equal(countItems(cart), 5)
  })
})
