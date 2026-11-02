import { useTranslation } from 'react-i18next'
import { i18n } from '../../utils/i18n'

/**
 * The TopBar component.
 * Contains the project title, save state, and language selector.
 */
export const TopBar = () => {
  const { t } = useTranslation()
  return (
    <header className='ce-topbar'>
      <div className='ce-brand'>
        <div className='ce-brand-mark' aria-hidden='true'>
          ⌂
        </div>
        <div>
          <p className='ce-eyebrow'>{t('project')}</p>
          <h1>{t('editor')}</h1>
        </div>
      </div>
      <div className='ce-top-actions'>
        <span className='ce-save-state'>
          <span />
          {t('localDemo')}
        </span>
        <span className='ce-save-state'>{t('multiSelect')}</span>

        {/* Localization or Language toggle dropdown */}
        <label className='ce-language'>
          <span className='ce-sr-only'>{t('language')}</span>
          <select
            value={i18n.language}
            onChange={(event) => void i18n.changeLanguage(event.target.value)}
            aria-label={t('language')}
          >
            <option value='en'>English</option>
            <option value='vi'>Vietnamese</option>
            <option value='zh'>Simplified Chinese</option>
          </select>
        </label>
      </div>
    </header>
  )
}
