/* eslint jsdoc/require-jsdoc: off */
import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutItem, RuleViolation } from '../types'
import { EQUIPMENT } from '../types'
import type { AssistantReply } from './assistantReply'
import { sampleAssistantConversations } from './assistantReply'

type AssistantPanelProps = {
  /** Current room contents used to ground the mock answer and suggestion. */
  items: LayoutItem[]
  /** Current spacing violations used to explain the suggested adjustment. */
  violations: RuleViolation[]
  /** Whether a suggested edit is currently visible as a scene preview. */
  proposalPending: boolean
  /** Called after the assistant finishes streaming a structured response. */
  onReply: (reply: AssistantReply) => void
  /** Commits the currently previewed suggestion. */
  onAccept: () => void
  /** Dismisses the currently previewed suggestion without editing the layout. */
  onReject: () => void
}

/** Streams a mocked answer and displays actions for a pending scene proposal. */
export function AssistantPanel({
  items,
  violations,
  proposalPending,
  onReply,
  onAccept,
  onReject,
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
    onReply(nextReply)
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

  return (
    <section className='ce-panel ce-assistant'>
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>03 / COPILOT</p>
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
                onClick={onAccept}
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
