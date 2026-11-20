import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { type AssistentApiKey } from './useAgent'

type AssistantApiConfigProps = {
  assistentApiKey: AssistentApiKey
  setAssistentApiKey: (apiKey: AssistentApiKey) => void
}

/** API provider and model configuration for the assistant. */
export function AssistantApiConfig({
  assistentApiKey,
  setAssistentApiKey,
}: AssistantApiConfigProps): ReactElement {
  const { t } = useTranslation()

  return (
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
        {/* Choose among providers such as Groq and OpenRouter */}
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
          <label>
            <input
              name='ai-assistant-provider'
              value={'local' satisfies AssistentApiKey['name']}
              type='radio'
              checked={assistentApiKey.name === 'local'}
              onChange={() =>
                setAssistentApiKey({
                  ...assistentApiKey,
                  name: 'local',
                  url: assistentApiKey.url || 'http://localhost:1234/v1',
                })
              }
            />
            <span>Local / URL</span>
          </label>
        </fieldset>

        {assistentApiKey.name === 'local' && (
          <label className='ce-apikey-field' htmlFor='ce-assistant-url'>
            <span>{t('assistantUrlPlaceholder')}</span>
            <input
              id='ce-assistant-url'
              name='base-url'
              value={assistentApiKey.url}
              type='url'
              onChange={(event) =>
                setAssistentApiKey({
                  ...assistentApiKey,
                  url: event.target.value,
                })
              }
              placeholder='https://127.0.0.1:8443'
              autoComplete='url'
              spellCheck={false}
            />
          </label>
        )}

        {/* Model name */}
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

        {/* API key */}
        <label className='ce-apikey-field' htmlFor='ce-assistant-api-key'>
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
  )
}
