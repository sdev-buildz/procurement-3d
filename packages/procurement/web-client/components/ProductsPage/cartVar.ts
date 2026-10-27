import type { Product } from '@types-gen-react-apollo'
import { makeVarSynced } from 'apollo-state-sync'

/** The cart in a Apollo Reactive Variable. It's synced across browsing contexts. */
export const cartVar = makeVarSynced<CartItem[]>([], 'cart')

/**
 * To update the value of {@link cartVar}
 */
export const setCartVar = (
  action: {
    id: NonNullable<Product['id']>
    remove?: boolean
  },
  catalog: Product[]
) => {
  const prev = cartVar()
  const inCart = prev.find((p) => p.id === action.id)

  // Remove from cart
  if (action.remove) {
    if (!inCart) return prev
    if (inCart.count === 1)
      return cartVar([...prev.filter((p) => p.id !== action.id)])
    return cartVar(
      prev.map((p) => (p.id === action.id ? { ...p, count: p.count - 1 } : p))
    )
  }

  // Add to cart
  const stockCount = catalog.find((p) => p.id === action.id)?.stockCount

  if (inCart) {
    return cartVar(
      prev.map((p) => {
        if (p.id !== action.id) return p
        if (p.count === stockCount) return p
        return { ...p, count: p.count + 1 }
      })
    )
  }

  if (stockCount === 0) return prev
  cartVar([...prev, { id: action.id, count: 1 }])
}

/**
 * An item in cart
 */
export type CartItem = {
  id: NonNullable<Product['id']>
  count: number
}
