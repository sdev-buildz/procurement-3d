import type { Product } from '@types-gen-react-apollo'
import { beforeEach, describe, expect, it } from 'vitest'
import { cartVar, setCartVar } from './cartVar'

const catalog = [
  { id: 'product-1', stockCount: 2 },
  { id: 'product-2', stockCount: 0 },
] satisfies Product[]

describe('setCartVar', () => {
  beforeEach(() => {
    cartVar([])
  })

  it('adds products and does not exceed available stock', () => {
    setCartVar({ id: 'product-1' }, catalog)
    setCartVar({ id: 'product-1' }, catalog)
    setCartVar({ id: 'product-1' }, catalog)

    expect(cartVar()).toEqual([{ id: 'product-1', count: 2 }])
  })

  it('does not add products that are out of stock', () => {
    setCartVar({ id: 'product-2' }, catalog)

    expect(cartVar()).toEqual([])
  })

  it('decrements and removes products from the cart', () => {
    cartVar([{ id: 'product-1', count: 2 }])

    setCartVar({ id: 'product-1', remove: true }, catalog)
    expect(cartVar()).toEqual([{ id: 'product-1', count: 1 }])

    setCartVar({ id: 'product-1', remove: true }, catalog)
    expect(cartVar()).toEqual([])
  })

  it('leaves the cart unchanged when removing an absent product', () => {
    const cart = [{ id: 'product-1', count: 1 }]
    cartVar(cart)

    const result = setCartVar({ id: 'product-2', remove: true }, catalog)

    expect(result).toBe(cart)
    expect(cartVar()).toBe(cart)
  })
})
