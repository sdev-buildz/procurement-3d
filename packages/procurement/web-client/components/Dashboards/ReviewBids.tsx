import { gql, type TypedDocumentNode } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  Button,
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
  const [selectedApprovals, setSelectedApprovals] = useState<
    Record<number, number>
  >({})

  const handleBidApprovalSelection = (
    rfqLineItemId: number,
    bidLineItemId: number
  ) => {
    setSelectedApprovals((previousSelections) => {
      const nextSelections = { ...previousSelections }

      if (nextSelections[rfqLineItemId] === bidLineItemId) {
        delete nextSelections[rfqLineItemId]
        return nextSelections
      }

      nextSelections[rfqLineItemId] = bidLineItemId
      return nextSelections
    })
  }

  const handleApproveSelections = async () => {
    const ids = bidsOfRfq.data?.bidsOfRfq?.rfqLineItems?.flatMap(
      (rfqLineItem) => {
        if (rfqLineItem.id == null) {
          return []
        }

        const selectedBidId = selectedApprovals[rfqLineItem.id]
        const rowHasApprovedBid = rfqLineItem.bidLineItems?.some(
          (bidLineItem) => bidLineItem.isApproved
        )
        if (selectedBidId === undefined || rowHasApprovedBid) {
          return []
        }

        const selectedBid = rfqLineItem.bidLineItems?.find(
          (bidLineItem) => bidLineItem.id === selectedBidId
        )

        if (!selectedBid) {
          return []
        }

        return selectedBid.id == null ? [] : [selectedBid.id]
      }
    )
    console.log('ids =', ids)
    if (!ids?.length) {
      return
    }

    await approveBids({ variables: { ids } })
    await bidsOfRfq.refetch()
    setSelectedApprovals({})
  }
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
              isApproved
              bid {
                supplier {
                  id
                  companyName
                  country
                  name
                }
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

  const [approveBids, { loading: approvingBids, error: approveBidsError }] =
    useMutation(
      gql`
        mutation approveBidsMutation($ids: [Int!]!) {
          approveBids(ids: $ids) {
            id
            isApproved
          }
        }
      ` as TypedDocumentNode<
        {
          approveBids: Array<{
            id?: number | null
            isApproved?: boolean | null
          }> | null
        },
        { ids: number[] }
      >
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
      {approveBidsError && <p>Error approving bids...</p>}
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
            {bidsOfRfq.data?.bidsOfRfq?.rfqLineItems?.map((rfqLineItem) => {
              if (rfqLineItem.id == null) {
                return null
              }

              const rfqLineItemId = rfqLineItem.id
              const rowHasApprovedBid = rfqLineItem.bidLineItems?.some(
                (bidLineItem) => bidLineItem.isApproved
              )
              const selectedBidId = selectedApprovals[rfqLineItemId]

              return (
                <TableRow key={rfqLineItemId}>
                  <TableCell>{rfqLineItemId}</TableCell>
                  <TableCell>{rfqLineItem.quantity}</TableCell>
                  <TableCell>
                    {rfqLineItem.part?.id}-{rfqLineItem.part?.name}
                  </TableCell>
                  <TableCell>
                    {rfqLineItem.part?.vehicleModel?.id}-
                    {rfqLineItem.part?.vehicleModel?.name}
                  </TableCell>
                  {rfqLineItem.bidLineItems?.map((bidLineItem, bidIndex) => {
                    const bidLineItemId = bidLineItem.id
                    const isSelected =
                      bidLineItemId != null && selectedBidId === bidLineItemId
                    const isApproved = !!bidLineItem.isApproved
                    const isInteractive =
                      !rowHasApprovedBid && bidLineItemId != null

                    return (
                      <TableCell
                        key={bidLineItemId ?? bidIndex}
                        onClick={() => {
                          if (!rowHasApprovedBid && bidLineItemId != null) {
                            handleBidApprovalSelection(
                              rfqLineItemId,
                              bidLineItemId
                            )
                          }
                        }}
                        sx={{
                          cursor: isInteractive ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                          ...(isApproved && {
                            outline: '1px solid blue',
                            backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          }),
                          ...(isSelected && {
                            outline: '2px solid #2e7d32',
                            backgroundColor: 'rgba(46, 125, 50, 0.12)',
                          }),
                          ...(isInteractive &&
                            !isSelected && {
                              '&:hover': {
                                outline: '1px solid rgba(25, 118, 210, 0.7)',
                                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                              },
                            }),
                        }}
                      >
                        {bidLineItem.totalAmount}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        type='button'
        variant={'outlined'}
        onClick={handleApproveSelections}
        disabled={approvingBids || Object.keys(selectedApprovals).length === 0}
      >
        {approvingBids ? 'Approving...' : 'Confirm Approvals'}
      </Button>
    </section>
  )
}
