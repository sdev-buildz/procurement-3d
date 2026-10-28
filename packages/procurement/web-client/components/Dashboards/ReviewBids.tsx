import { gql, type TypedDocumentNode } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  SortBidsEnum,
  type FilterInput,
  type Query,
} from '@types-gen-react-apollo'
import { useEffect, useState } from 'react'

/**
 * Buyers can review the bids on their RFQs.
 */
export const ReviewBids = ({ rfqId }: { rfqId: number }) => {
  const bidsOfRfq = useQuery(
    gql`
      query bidsOfRfqQuery($rfqId: Int!, $filter: FilterInput) {
        bidsOfRfq(rfqId: $rfqId, filter: $filter) {
          id
          title
          description
          bidClosingDate
          deliveryDeadline
          rfqLineItems {
            id
            quantity
            part {
              id
              name
              vehicleModel {
                id
                name
              }
            }
            bidLineItems {
              id
              leadTimeWeeks
              technicalNotes
              totalAmount
              bid {
                supplier {
                  id
                  companyName
                  country
                  name
                }
              }
              approval {
                id
                decision
                justification
              }
            }
          }
        }
      }
    ` as TypedDocumentNode<Pick<Query, 'bidsOfRfq'>>,
    {
      variables: {
        rfqId,
      },
    }
  )

  const [filter] = useState<FilterInput>({
    sort: SortBidsEnum.TotalAmount,
  })
  useEffect(() => {
    console.dir(filter)
  }, [filter])
  return (
    <section>
      <h2>Review Bids</h2>
      {/* Filter form */}

      <h3>RFQ Details</h3>
      {bidsOfRfq.loading && <p>Loading...</p>}
      {bidsOfRfq.error && <p>Error...</p>}
      {bidsOfRfq.data && (
        <>
          <h4>{bidsOfRfq.data.bidsOfRfq?.title}</h4>
          <dl>
            <dt>Description:</dt>
            <dd>{bidsOfRfq.data.bidsOfRfq?.description}</dd>
            <dt>Bid Closing Date:</dt>
            <dd>{bidsOfRfq.data.bidsOfRfq?.bidClosingDate}</dd>
            <dt>Delivery Deadline:</dt>
            <dd>{bidsOfRfq.data.bidsOfRfq?.deliveryDeadline}</dd>
          </dl>
        </>
      )}

      <h3>RFQ Line Items</h3>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Vehicle Part</TableCell>
              <TableCell>Vehicle Model</TableCell>
              {Array.from({ length: 8 })
                .fill(0)
                .map((_, i) => (
                  <TableCell key={i}>Bid {i + 1}</TableCell>
                ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {bidsOfRfq.data?.bidsOfRfq?.rfqLineItems?.map((rfqLineItem) => (
              <TableRow key={rfqLineItem.id}>
                <TableCell>{rfqLineItem.id}</TableCell>
                <TableCell>{rfqLineItem.quantity}</TableCell>
                <TableCell>
                  {rfqLineItem.part?.id}-{rfqLineItem.part?.name}
                </TableCell>
                <TableCell>
                  {rfqLineItem.part?.vehicleModel?.id}-
                  {rfqLineItem.part?.vehicleModel?.name}
                </TableCell>
                {rfqLineItem.bidLineItems?.map((bidLineItem) => (
                  <TableCell key={bidLineItem.id}>
                    {bidLineItem.totalAmount}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  )
}
