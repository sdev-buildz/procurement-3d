import { gql, type TypedDocumentNode } from '@apollo/client'
import { useSubscription } from '@apollo/client/react'
import type { Subscription } from '@types-gen-react-apollo'
import { useState } from 'react'

/**
 * Subscribes to real-time WebSocket notifications on bid approvals.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<string[]>([])

  //  Subsribe to product updates on price and stock quantities
  useSubscription(
    gql`
      subscription bidApprovalsSubscription {
        bidApprovals {
          id
        }
      }
    ` as TypedDocumentNode<Pick<Subscription, 'bidApprovals'>>,
    {
      fetchPolicy: 'network-only',
      onData: ({ data }) => {
        const approvalIds = data.data?.bidApprovals?.map((a) => a.id)
        if (!approvalIds) return
        approvalIds.forEach((newId) => {
          setNotifications((n) => [...n, `Bid ${newId} has been approved!`])
          setTimeout(() => {
            setNotifications((notifications) => [...notifications.slice(1)])
          }, 2000)
        })
      },
    }
  )

  return notifications
}
