/* eslint jsdoc/require-jsdoc: off */
import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { useHistory } from '../hooks/useHistory'
import type { RuleViolation } from '../hooks/useViolations'
import type { LayoutItem } from '../items'
import { EQUIPMENT } from '../items'
import { constrainPosition } from '../layout'
import type { AssistantProposal, AssistantReply } from './assistantReply'
import { sampleAssistantConversations } from './assistantReply'

type AssistantPanelProps = {
  /** Current room contents used to ground the mock answer and suggestion. */
  items: LayoutItem[]
  /** Current spacing violations used to explain the suggested adjustment. */
  violations: RuleViolation[]
  /** Whether a suggested edit is currently visible as a scene preview. */
  proposalPending: boolean
  /** Dismisses the currently previewed suggestion without editing the layout. */
  onReject: () => void
  proposal: AssistantProposal | null
  setProposal: (newProposal: AssistantProposal | null) => void
  historyState: ReturnType<typeof useHistory>
  setAnnouncement: (value: string) => void
  setSelectedIds: (ids: Set<LayoutItem['id']>) => void
}

/** Streams a mocked answer and displays actions for a pending scene proposal. */
export function AssistantPanel({
  items,
  violations,
  proposalPending,
  onReject,
  proposal,
  setProposal,
  historyState,
  setAnnouncement,
  setSelectedIds,
}: AssistantPanelProps): ReactElement {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [reply, setReply] = useState<AssistantReply | null>(null)
  const [streamedMessage, setStreamedMessage] = useState('')
  const [streaming, setStreaming] = useState(false)

  const sendQuestion = async (
    submittedQuestion: string,
    sampleId?: (typeof sampleAssistantConversations)[number]['id']
  ) => {
    if (!submittedQuestion || streaming) return

    setQuestion('')
    setAssistantQuestion(submittedQuestion)
    setStreamedMessage('')
    setStreaming(true)

    const firstViolation = violations[0]
    const sample = sampleAssistantConversations.find(
      (conversation) => conversation.id === sampleId
    )
    const itemToMove = sample?.equipmentType
      ? (items.find((item) => item.type === sample.equipmentType) ??
        firstViolation?.second ??
        items[0])
      : (firstViolation?.second ?? items[0])
    const target = itemToMove
      ? {
          x: itemToMove.x + 2,
          z: itemToMove.z + (firstViolation ? 0 : 1),
        }
      : null
    const nextReply: AssistantReply = {
      message: t(sample?.messageKey ?? 'assistantAnswer', {
        count: items.length,
        issues: violations.length,
        item: itemToMove ? t(EQUIPMENT[itemToMove.type].nameKey) : t('items'),
      }),
      proposedChange:
        itemToMove && target
          ? {
              action: 'move_item',
              itemId: itemToMove.id,
              target,
              rationale: t(sample?.rationaleKey ?? 'assistantRationale', {
                item: t(EQUIPMENT[itemToMove.type].nameKey),
              }),
            }
          : null,
    }

    setReply(nextReply)
    for (let index = 0; index < nextReply.message.length; index += 2) {
      setStreamedMessage(nextReply.message.slice(0, index + 2))
      await new Promise((resolve) => window.setTimeout(resolve, 18))
    }

    setStreaming(false)
    handleAssistantReply(nextReply)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendQuestion(question.trim())
  }

  const handleSampleClick = (
    sampleId: (typeof sampleAssistantConversations)[number]['id']
  ) => {
    const sample = sampleAssistantConversations.find(
      (conversation) => conversation.id === sampleId
    )
    if (sample) void sendQuestion(t(sample.promptKey), sample.id)
  }

  const handleAssistantReply = (reply: AssistantReply) => {
    const change = reply.proposedChange
    if (!change) {
      setProposal(null)
      return
    }

    const currentItems = items
    const currentItem = currentItems.find((item) => item.id === change.itemId)
    if (!currentItem) {
      setProposal(null)
      return
    }

    setProposal({
      ghost: {
        ...currentItem,
        ...constrainPosition(currentItem, change.target.x, change.target.z),
      },
    })
  }

  const acceptProposal = () => {
    if (!proposal) return
    const currentItems = items
    if (!currentItems.some((item) => item.id === proposal.ghost.id)) {
      setProposal(null)
      return
    }
    historyState.commitItems(
      currentItems.map((item) =>
        item.id === proposal.ghost.id ? proposal.ghost : item
      )
    )
    setSelectedIds(new Set([proposal.ghost.id]))
    setProposal(null)
    setAnnouncement(t('accept'))
  }

  return (
    <section className='ce-panel ce-assistant'>
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>03 / {t('COPILOT')}</p>
          <h2>
            <span className='ce-assistant-spark' aria-hidden='true'>
              ✳
            </span>
            {t('assistant')}
          </h2>
        </div>
        <span className='ce-beta-tag'>MOCK</span>
      </div>
      <p className='ce-assistant-note'>{t('assistantNote')}</p>
      <div className='ce-chat-window' aria-live='polite'>
        {assistantQuestion ? (
          <p className='ce-chat-user'>{assistantQuestion}</p>
        ) : null}
        {reply ? (
          <p className='ce-chat-reply'>
            <span className='ce-reply-mark' aria-hidden='true'>
              ✳
            </span>
            {streamedMessage}
            {streaming ? <span className='ce-stream-cursor' /> : null}
          </p>
        ) : (
          <div className='ce-chat-starters'>
            <p className='ce-chat-empty'>{t('askAssistantHint')}</p>
          </div>
        )}
        {!streaming && !proposalPending ? (
          <div className='ce-sample-conversations'>
            {sampleAssistantConversations.map((sample) => (
              <button
                type='button'
                key={sample.id}
                onClick={() => handleSampleClick(sample.id)}
              >
                <span aria-hidden='true'>✳</span>
                {t(sample.promptKey)}
              </button>
            ))}
          </div>
        ) : null}
        {proposalPending && reply?.proposedChange ? (
          <>
            <p className='ce-proposal-rationale'>
              {reply.proposedChange.rationale}
            </p>
            <div className='ce-proposal-actions'>
              <button
                type='button'
                className='ce-accept-button'
                onClick={acceptProposal}
              >
                {t('accept')}
              </button>
              <button
                type='button'
                className='ce-reject-button'
                onClick={onReject}
              >
                {t('reject')}
              </button>
            </div>
          </>
        ) : null}
      </div>
      <form className='ce-chat-form' onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t('assistantPlaceholder')}
          aria-label={t('assistantPlaceholder')}
          disabled={streaming}
        />
        <button
          type='submit'
          disabled={streaming || !question.trim()}
          aria-label={t('send')}
        >
          <span aria-hidden='true'>↑</span>
        </button>
      </form>
    </section>
  )
}
