import { gql, type TypedDocumentNode } from '@apollo/client'
import type { Query } from '@types-gen-react-apollo'

/**
 * To fetch the available products for catalog
 */
export const productsQuery = gql`
  query productsQuery {
    products {
      id
      name
      summary
      description
      price
      stockCount
      imageUrl
    }
  }
` as TypedDocumentNode<Pick<Query, 'products'>>
