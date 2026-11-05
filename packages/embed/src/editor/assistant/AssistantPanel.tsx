/* eslint jsdoc/require-jsdoc: off */
import type { ReactElement, SubmitEventHandler } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { useHistory } from '../hooks/useHistory'
import type { RuleViolation } from '../hooks/useViolations'
import type { LayoutItem } from '../items'
import type { AssistantProposal } from './assistantReply'
import { sampleAssistantConversations } from './assistantReply'
import { useAssistant, type AssistentApiKey } from './useAgent'

export type AssistantPanelProps = {
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
  isPerfPanelOpen: boolean
  setIsPerfPanelOpen: (open: boolean) => void
}

export type ToolCallMessage = {
  toolName: string
  message: string
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
  isPerfPanelOpen,
  setIsPerfPanelOpen,
}: AssistantPanelProps): ReactElement {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [toolCallMessages, setToolCallMessages] = useState<
    Array<{
      toolName: string
      message: string
    }>
  >([])
  const [streamedMessage, setStreamedMessage] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [assistantPanelOpen, setAssistantPanelOpen] = useState(true)
  const samplePromptsDetailsRef = useRef<HTMLDetailsElement>(null)
  const [assistentApiKey, setAssistentApiKey] = useState<AssistentApiKey>({
    name: 'groq',
    model: 'qwen/qwen3.8-27b',
    key: '',
  })

  useEffect(() => {
    if (streaming && samplePromptsDetailsRef.current) {
      samplePromptsDetailsRef.current.open = false
    }
  }, [streaming])

  const assistant = useAssistant({
    historyState,
    items,
    proposal,
    setProposal,
    violations,
    setStreaming,
    setToolCallMessages,
    toolCallMessages,
    setStreamedMessage,
    assistentApiKey,
  })

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || streaming) return
    setQuestion('')
    void assistant.messageAssistant(trimmedQuestion)
  }

  /** When user chooses a sample readily available prompt */
  const handleSampleClick = (
    sampleId: (typeof sampleAssistantConversations)[number]['id']
  ) => {
    const sample = sampleAssistantConversations.find(
      (conversation) => conversation.id === sampleId
    )
    if (sample) void assistant.messageAssistant(t(sample.promptKey))
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
      <details
        open={isPerfPanelOpen ? false : assistantPanelOpen}
        onToggle={(event) => {
          const open = event.currentTarget.open
          setAssistantPanelOpen(open)
          if (open) setIsPerfPanelOpen(false)
        }}
      >
        {/* Header */}
        <summary className='ce-panel-heading'>
          <div>
            <p className='ce-eyebrow'>03 / {t('COPILOT')}</p>
            <h2>
              <span className='ce-assistant-spark' aria-hidden='true'>
                ✳
              </span>
              {t('assistant')}
            </h2>
          </div>
          {proposalPending ? (
            <span className='ce-assistant-status'>{t('previewing')}</span>
          ) : null}
        </summary>

        {/* Content */}
        <div className='ce-assistant-content'>
          <div
            className='ce-chat-window'
            aria-live='polite'
            aria-busy={streaming}
          >
            {/* The tool calls made by the agent are shown. */}
            <ol className='ce-tool-calls' aria-label='Assistant activity'>
              {toolCallMessages.map((message, index) => (
                <li key={`${message.toolName}-${index}`}>
                  <dl>
                    <dt>{message.toolName}</dt>
                    <dd>{message.message}</dd>
                  </dl>
                </li>
              ))}
            </ol>

            {/* The agent's response message */}
            {streamedMessage ? (
              <p className='ce-chat-reply'>
                <span className='ce-reply-mark' aria-hidden='true'>
                  ✳
                </span>
                {streamedMessage}
                {streaming ? <span className='ce-stream-cursor' /> : null}
              </p>
            ) : (
              <></>
            )}
            {streamedMessage || streaming ? (
              <></>
            ) : (
              <div className='ce-chat-starters'>
                <div className='ce-chat-empty-icon' aria-hidden='true'>
                  ✳
                </div>
                <p className='ce-chat-empty'>{t('askAssistantHint')}</p>
              </div>
            )}

            {/* Sample readily available prompts */}
            <details ref={samplePromptsDetailsRef}>
              <summary>
                <span>Sample prompts</span>
                <span aria-hidden='true'>+</span>
              </summary>
              <div className='ce-sample-conversations'>
                {sampleAssistantConversations.map((sample) => (
                  <button
                    type='button'
                    key={sample.id}
                    onClick={() => handleSampleClick(sample.id)}
                    disabled={streaming}
                  >
                    <span aria-hidden='true'>✳</span>
                    {t(sample.promptKey)}
                  </button>
                ))}
              </div>
            </details>

            {/* API Key and model provider configurations */}
            <details>
              <summary>
                <span>{t('assistantApiConfigTitle')}</span>
                <span aria-hidden='true'>+</span>
              </summary>
              <form
                className='ce-apikey-form'
                aria-label={t('assistantApiConfigAriaLabel')}
                onSubmit={(event) => event.preventDefault()}
              >
                <fieldset className='ce-apikey-providers'>
                  <legend>{t('assistantProviderPlaceholder')}</legend>
                  <label>
                    <input
                      name='ai-assistant-provider'
                      value={'groq' satisfies AssistentApiKey['name']}
                      type='radio'
                      checked={assistentApiKey.name === 'groq'}
                      onChange={() =>
                        setAssistentApiKey({
                          ...assistentApiKey,
                          name: 'groq',
                        })
                      }
                    />
                    <span>Groq</span>
                  </label>
                  <label>
                    <input
                      name='ai-assistant-provider'
                      value={'openrouter' satisfies AssistentApiKey['name']}
                      type='radio'
                      checked={assistentApiKey.name === 'openrouter'}
                      onChange={() =>
                        setAssistentApiKey({
                          ...assistentApiKey,
                          name: 'openrouter',
                        })
                      }
                    />
                    <span>OpenRouter</span>
                  </label>
                </fieldset>

                <label className='ce-apikey-field' htmlFor='ce-assistant-model'>
                  <span>{t('assistantModelPlaceholder')}</span>
                  <input
                    id='ce-assistant-model'
                    name='model'
                    value={assistentApiKey.model}
                    onChange={(event) =>
                      setAssistentApiKey({
                        ...assistentApiKey,
                        model: event.target.value,
                      })
                    }
                    placeholder={t('assistantModelPlaceholder')}
                    autoComplete='off'
                    spellCheck={false}
                  />
                </label>

                <label
                  className='ce-apikey-field'
                  htmlFor='ce-assistant-api-key'
                >
                  <span>{t('assistantKeyPlaceholder')}</span>
                  <input
                    id='ce-assistant-api-key'
                    name='api-key'
                    value={assistentApiKey.key}
                    type='password'
                    onChange={(event) =>
                      setAssistentApiKey({
                        ...assistentApiKey,
                        key: event.target.value,
                      })
                    }
                    placeholder={t('assistantKeyPlaceholder')}
                    autoComplete='off'
                    spellCheck={false}
                  />
                </label>
              </form>
            </details>

            {/* Buttons to accept or reject the agent's suggestion. */}
            {proposal ? (
              <div className='ce-proposal-card'>
                <div className='ce-proposal-copy'>
                  <span className='ce-proposal-dot' aria-hidden='true' />
                  <div>
                    <strong>{t('previewing')}</strong>
                    <p>{t('assistantReady')}</p>
                  </div>
                </div>
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
              </div>
            ) : null}
          </div>

          {/* Form to submit message to the assistant. */}
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
        </div>
      </details>
    </section>
  )
}
