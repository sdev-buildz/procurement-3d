import AddShoppingCart from '@mui/icons-material/AddShoppingCart'
import RemoveShoppingCart from '@mui/icons-material/RemoveShoppingCart'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { Maybe, Product } from '@types-gen-react-apollo'
import { useEffect, useState } from 'react'
import { getImgColor } from '../../lib/colors'
import type { CartItem } from './cartVar'
import { setCartVar } from './cartVar'

/**
 * A product card
 */
export const ProductCard = ({
  product,
  cart,
  products,
}: {
  product: Product
  cart: CartItem[]
  products?: Maybe<Product[]> | undefined
}) => {
  const [bgColor, setBgColor] = useState<string>('rgb(246, 246, 246)')

  useEffect(() => {
    if (!product.imageUrl) return

    const img = new Image()

    // Enable CORS to avoid canvas tainting errors when extracting colors
    img.crossOrigin = 'Anonymous'
    img.src = product.imageUrl
    let color: string
    if (img.complete) {
      color = getImgColor(img)
      setBgColor((prev) => color ?? prev)
    } else {
      // Wait for the load event
      img.addEventListener('load', () => {
        color = getImgColor(img)
        setBgColor((prev) => color ?? prev)
      })
    }
  }, [product])

  return (
    <article
      key={product.id}
      className='product'
      style={{
        backgroundColor: bgColor,
      }}
    >
      <img
        src={product.imageUrl ?? undefined}
        alt={product.name ?? 'product image'}
      ></img>
      <h3>{product.name}</h3>
      <p>{product.summary}</p>
      <Typography
        className='price'
        component='data'
        value={product.price ?? undefined}
      >
        <strong>${product.price}</strong>
      </Typography>
      {/* 
          The product cards in catalog display stock counts and have 
            buttons to add or remove from cart
      */}
      {products ? (
        <>
          <IconButton
            className='addToCart'
            color='secondary'
            size='small'
            onClick={() => setCartVar({ id: product.id! }, products ?? [])}
            disabled={
              (cart.find((p) => p.id === product.id)?.count ?? 0) ===
              product.stockCount
                ? true
                : undefined
            }
            aria-labelledby='label-add-to-cart'
          >
            <AddShoppingCart />
            <div id='label-add-to-cart' className='sr-only'>
              add to cart
            </div>
          </IconButton>
          {/* Count of the product in cart */}
          <Typography
            className='cartCountInputValue'
            color='secondary'
            component='strong'
          >
            {cart.find((p) => p.id === product.id)?.count ?? 0}
          </Typography>
          <IconButton
            className='removeFromCart'
            size='small'
            onClick={() =>
              setCartVar({ id: product.id!, remove: true }, products ?? [])
            }
            disabled={cart.find((p) => p.id === product.id) ? undefined : true}
            aria-labelledby='label-remove-from-cart'
          >
            <RemoveShoppingCart />
            <div id='label-remove-from-cart' className='sr-only'>
              remove from cart
            </div>
          </IconButton>
          <br />
          <Typography
            variant='body2'
            // color='tertiaryVariant'
            component='data'
            value={product.stockCount ?? undefined}
          >
            <div id='stock-count-label' className='sr-only'>
              stock count:
            </div>
            <data
              value={
                product.stockCount !== null ? product.stockCount : undefined
              }
              aria-labelledby='stock-count-label'
            >
              {product.stockCount}
            </data>
            in stock
          </Typography>
        </>
      ) : (
        (() => {
          // The product cards in cart display the counts of the products in cart
          const count = cart.find((p) => p.id === product.id)?.count
          return (
            <>
              <Typography
                variant='body2'
                color='text.secondary'
                component='data'
                value={product.stockCount ?? undefined}
              >
                *<data value={count}> {count}</data>
                in cart
              </Typography>
            </>
          )
        })()
      )}
    </article>
  )
}
