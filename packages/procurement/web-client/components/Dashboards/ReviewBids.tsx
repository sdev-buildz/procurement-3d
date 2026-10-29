import { gql, type TypedDocumentNode } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  Box,
  Button,
  Paper,
  SnackbarContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { type Query } from '@types-gen-react-apollo'
import { useState } from 'react'
import { useNotifications } from './useNotifications'

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

  const notifications = useNotifications()

  // const [filter] = useState<FilterInput>({
  //   sort: SortBidsEnum.TotalAmount,
  // })

  return (
    <section aria-labelledby='review-bids-title'>
      <h2 id='review-bids-title'>Review Bids</h2>

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

      <h3>RFQ Details</h3>
      {bidsOfRfq.loading && <p aria-live='polite'>Loading...</p>}
      {bidsOfRfq.error && <p aria-live='polite'>Error...</p>}
      {approveBidsError && <p aria-live='assertive'>Error approving bids...</p>}
      {bidsOfRfq.data && (
        <Paper variant='outlined' sx={{ mb: 3, p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box
              component='h4'
              sx={{ m: 0, typography: 'h5', fontWeight: 600 }}
            >
              {bidsOfRfq.data.bidsOfRfq?.title}
            </Box>
            <Box
              component='dl'
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'minmax(150px, max-content) 1fr',
                },
                columnGap: 2,
                rowGap: 1.5,
                m: 0,
              }}
            >
              <Box
                component='dt'
                sx={{ m: 0, color: 'text.secondary', fontWeight: 600 }}
              >
                Description
              </Box>
              <Box component='dd' sx={{ m: 0 }}>
                {bidsOfRfq.data.bidsOfRfq?.description}
              </Box>
              <Box
                component='dt'
                sx={{ m: 0, color: 'text.secondary', fontWeight: 600 }}
              >
                Bid Closing Date
              </Box>
              <Box component='dd' sx={{ m: 0 }}>
                {bidsOfRfq.data.bidsOfRfq?.bidClosingDate
                  ? new Date(
                      bidsOfRfq.data.bidsOfRfq?.bidClosingDate
                    ).toDateString()
                  : ''}
              </Box>
              <Box
                component='dt'
                sx={{ m: 0, color: 'text.secondary', fontWeight: 600 }}
              >
                Delivery Deadline
              </Box>
              <Box component='dd' sx={{ m: 0 }}>
                {bidsOfRfq.data.bidsOfRfq?.deliveryDeadline
                  ? new Date(
                      bidsOfRfq.data.bidsOfRfq?.deliveryDeadline
                    ).toDateString()
                  : ''}
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      <h3>RFQ Line Items</h3>
      <TableContainer component={Paper}>
        <Table aria-label='RFQ bids review table'>
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
              const partName = rfqLineItem.part?.name ?? 'Unknown part'
              const vehicleName =
                rfqLineItem.part?.vehicleModel?.name ?? 'Unknown model'

              return (
                <TableRow key={rfqLineItemId}>
                  <TableCell>{rfqLineItemId}</TableCell>
                  <TableCell>{rfqLineItem.quantity}</TableCell>
                  <TableCell>
                    {rfqLineItem.part?.id}-{partName}
                  </TableCell>
                  <TableCell>
                    {rfqLineItem.part?.vehicleModel?.id}-{vehicleName}
                  </TableCell>
                  {rfqLineItem.bidLineItems?.map((bidLineItem, bidIndex) => {
                    const bidLineItemId = bidLineItem.id
                    const isSelected =
                      bidLineItemId != null && selectedBidId === bidLineItemId
                    const isApproved = !!bidLineItem.isApproved
                    const isInteractive =
                      !rowHasApprovedBid && bidLineItemId != null
                    const supplierName =
                      bidLineItem.bid?.supplier?.companyName ??
                      bidLineItem.bid?.supplier?.name ??
                      'Supplier'
                    const bidSummary = `${supplierName} bid for ${partName} total ${bidLineItem.totalAmount}`

                    return (
                      <TableCell
                        key={bidLineItemId ?? bidIndex}
                        sx={{
                          p: 0,
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
                        <Box
                          component='button'
                          type='button'
                          onClick={() => {
                            if (!rowHasApprovedBid && bidLineItemId != null) {
                              handleBidApprovalSelection(
                                rfqLineItemId,
                                bidLineItemId
                              )
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              (event.key === 'Enter' || event.key === ' ') &&
                              isInteractive &&
                              bidLineItemId != null
                            ) {
                              event.preventDefault()
                              handleBidApprovalSelection(
                                rfqLineItemId,
                                bidLineItemId
                              )
                            }
                          }}
                          disabled={!isInteractive}
                          aria-label={bidSummary}
                          aria-pressed={isSelected}
                          sx={{
                            width: '100%',
                            minHeight: 52,
                            border: 'none',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: isInteractive ? 'pointer' : 'not-allowed',
                            font: 'inherit',
                            textAlign: 'center',
                            px: 1,
                            py: 1.5,
                            opacity: isInteractive ? 1 : 0.75,
                          }}
                        >
                          {bidLineItem.totalAmount}
                        </Box>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper
        component='footer'
        elevation={4}
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 24 },
          bottom: { xs: 16, sm: 24 },
          zIndex: 1100,
          borderRadius: 2,
        }}
      >
        <Button
          type='button'
          variant='contained'
          onClick={handleApproveSelections}
          disabled={approvingBids || Object.keys(selectedApprovals).length === 0}
          aria-label={`Confirm selected approvals for ${Object.keys(selectedApprovals).length} line items`}
          sx={{ m: 1 }}
        >
          {approvingBids ? 'Approving...' : 'Confirm Approvals'}
        </Button>
      </Paper>
    </section>
  )
}
