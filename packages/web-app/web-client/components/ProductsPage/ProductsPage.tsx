import { gql, type TypedDocumentNode } from '@apollo/client'
import {
  useMutation,
  useQuery,
  useReactiveVar,
  useSubscription,
} from '@apollo/client/react'
import ShoppingCartCheckout from '@mui/icons-material/ShoppingCartCheckout'
import Storefront from '@mui/icons-material/Storefront'
import Button from '@mui/material/Button'
import SnackbarContent from '@mui/material/SnackbarContent'
import Stack from '@mui/material/Stack'
import type { Mutation, Product, Subscription } from '@types-gen-react-apollo'
import { useState } from 'react'
import { productsQuery } from '../../util/docNodes'
import { ProductCard } from './ProductCard'
import { cartVar } from './cartVar'

/**
 * The page has a list of available products, a cart and a checkout button.
 */
export const ProductsPage = () => {
  const catalogResult = useQuery(productsQuery, {
    fetchPolicy: 'network-only',
  })

  const cart = useReactiveVar(cartVar)

  const [checkout] = useMutation(
    gql`
      mutation checkoutMutation($cart: [CheckoutInput!]!) {
        checkout(cart: $cart) {
          id
          stockCount
        }
      }
    ` as TypedDocumentNode<Pick<Mutation, 'checkout'>>,
    {
      variables: {
        cart,
      },
    }
  )

  const [notifications, setNotifications] = useState<string[]>([])

  //  Subsribe to product updates on price and stock quantities
  useSubscription(
    gql`
      subscription productUpdates {
        productUpdates {
          id
          price
          stockCount
        }
      }
    ` as TypedDocumentNode<Pick<Subscription, 'productUpdates'>>,
    {
      fetchPolicy: 'network-only',
      onData: ({ data }) => {
        const productUpdates = data.data?.productUpdates
        if (!productUpdates) return
        productUpdates.forEach((product) => {
          for (const attr of ['price', 'stockCount'] satisfies Array<
            keyof Product
          >) {
            const productData = catalogResult.data?.products?.find(
              (p) => p.id === product.id
            )
            if (attr in product && product[attr] !== productData?.[attr]) {
              {
                setNotifications((notifications) => [
                  ...notifications,
                  `${productData?.name}'s new ${attr === 'stockCount' ? 'stock count' : 'price'} is ${product[attr]}`,
                ])
                setTimeout(() => {
                  setNotifications((notifications) => [
                    ...notifications.slice(1),
                  ])
                }, 2000)
              }
            }
          }
        })
      },
    }
  )

  return (
    <section className='products-page'>
      <hgroup>
        <h2>
          <Storefront /> Products
        </h2>
        <p>Add Products to cart and click on checkout button</p>
      </hgroup>

      {/* Real-time notifications about stock and price updates. */}
      <Stack
        className='notifications'
        direction={'column'}
        spacing={2}
        aria-live='polite'
      >
        {notifications.map((notification, idx) => (
          <SnackbarContent key={idx} message={notification}></SnackbarContent>
        ))}
      </Stack>

      <div className='browse'>
        {/* Catalog */}
        <section className='catalog'>
          {catalogResult.data?.products?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cart={cart}
              products={catalogResult.data?.products}
            />
          ))}
        </section>

        {/* Cart */}
        <section className='cart'>
          <h4>Cart</h4>
          <ul className='items' aria-live='polite'>
            {cart.map(({ id, count }) => {
              const product = catalogResult.data?.products?.find(
                (p) => p.id === id
              )
              if (!product) return
              return (
                <li>
                  <ProductCard key={product.id} product={product} cart={cart} />
                </li>
              )
            })}
          </ul>

          <div className='checkout-container'>
            {(() => {
              const totalPrice = cart.reduce<number>((prev, item) => {
                const product = catalogResult.data?.products?.find(
                  (p) => p.id === item.id
                )
                if (!(typeof product?.price === 'number')) return -1
                return prev + product.price * item.count
              }, 0)
              return (
                <>
                  <data
                    className='total-price'
                    value={totalPrice}
                    aria-live='polite'
                    aria-atomic='true'
                  >
                    <div className='sr-only'>Total Price:</div>${totalPrice}
                  </data>
                </>
              )
            })()}

            {/* Checkout button */}
            <Button
              className='checkout'
              variant='contained'
              color='primary'
              type='button'
              onClick={() => checkout()}
              startIcon={<ShoppingCartCheckout />}
            >
              Checkout
            </Button>
          </div>
        </section>
      </div>
    </section>
  )
}
