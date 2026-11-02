import { useTranslation } from 'react-i18next'
import type { useHistory } from '../hooks/useHistory'

/**
 * The ToolBar component
 */
export const ToolBar = ({
  history,
  undo,
  redo,
  topDown,
  setTopDown,
}: Pick<ReturnType<typeof useHistory>, 'history' | 'undo' | 'redo'> & {
  topDown: boolean
  setTopDown: (topDown: boolean) => void
}) => {
  const { t } = useTranslation()
  return (
    <section className='ce-toolbar' aria-label={t('editor')}>
      <div className='ce-room-title'>
        <span className='ce-room-dot' />
        <strong>{t('room')}</strong>
        <span className='ce-room-size'>20 × 12 m</span>
      </div>
      <div className='ce-toolbar-actions'>
        <button
          type='button'
          className='ce-tool-button'
          onClick={undo}
          disabled={history.past.length === 0}
          title={`${t('undo')} · Ctrl/Cmd+Z`}
        >
          <span aria-hidden='true'>↶</span>
          {t('undo')}
        </button>
        <button
          type='button'
          className='ce-tool-button'
          onClick={redo}
          disabled={history.future.length === 0}
          title={`${t('redo')} · Ctrl/Cmd+Y`}
        >
          <span aria-hidden='true'>↷</span>
          {t('redo')}
        </button>
        <span className='ce-toolbar-divider' />
        <button
          type='button'
          className={`ce-tool-button ${topDown ? '' : 'is-active'}`}
          onClick={() => setTopDown(false)}
          aria-pressed={!topDown}
        >
          <span aria-hidden='true'>◇</span>
          {t('view3d')}
        </button>
        <button
          type='button'
          className={`ce-tool-button ${topDown ? 'is-active' : ''}`}
          onClick={() => setTopDown(true)}
          aria-pressed={topDown}
        >
          <span aria-hidden='true'>▦</span>
          {t('plan')}
        </button>
      </div>
    </section>
  )
}
