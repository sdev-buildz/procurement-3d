import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import type { AssistantProposal } from '../assistant/assistantReply'
import type { useViolations } from '../hooks/useViolations'
import { EQUIPMENT, type EquipmentName } from '../items'
import { RoomScene } from '../scene/RoomScene'

/**
 * Stage for the 3D canvas.
 * Displays canvas.
 * Adds header, footer, and legends with metadata stats about the scene.
 *
 * Can be used to add CSS absolute positioned overlays.
 */
export const StageFor3dViewer = ({
  topDown,
  placingItemName,
  proposal,
  violations,
  ...roomSceneProps
}: {
  placingItemName: EquipmentName | null
  proposal: AssistantProposal | null
  violations: ReturnType<typeof useViolations>
} & ComponentProps<typeof RoomScene>) => {
  const { t } = useTranslation()
  return (
    <section className='ce-stage ce-panel' aria-label={t('room')}>
      {/* Header */}
      <div className='ce-stage-heading'>
        <div>
          <span className='ce-live-dot' />
          <strong>{topDown ? t('plan') : t('liveScene')}</strong>
          <span className='ce-stage-subtitle'>
            20 m × 12 m <span>·</span> {t('stageGrid')}
          </span>
        </div>
        <span className='ce-stage-count'>
          {t('itemsCount', {
            displayCount: roomSceneProps.itemsDisplayed.length
              .toString()
              .padStart(2, '0'),
          })}
        </span>
      </div>

      {/* The 3D viewer. It also has floating legends on top (top with respect to z-index). */}
      <div className={`ce-canvas-wrap ${placingItemName ? 'is-placing' : ''}`}>
        <RoomScene
          {...roomSceneProps}
          topDown={topDown}
          violations={violations}
        />
        {proposal ? (
          <div className='ce-preview-banner'>
            <span className='ce-preview-swatch' />
            <span>{t('previewing')}</span>
          </div>
        ) : null}
        <div className='ce-canvas-legend'>
          <span>
            <i className='ce-legend-normal' /> {t('equipmentLegend')}
          </span>
          <span>
            <i className='ce-legend-warning' /> {t('issueLegend')}
          </span>
          {proposal ? (
            <span>
              <i className='ce-legend-preview' /> {t('previewLegend')}
            </span>
          ) : null}
        </div>
      </div>

      {/* Footer. Displays the list of rule violations */}
      <div className='ce-rule-bar'>
        <div className='ce-rule-heading'>
          <span
            className={
              violations.length ? 'ce-rule-icon is-warning' : 'ce-rule-icon'
            }
            aria-hidden='true'
          >
            {violations.length ? '!' : '✓'}
          </span>
          <div>
            <strong>{t('ruleCheck')}</strong>
            <small>
              {violations.length
                ? t('issueCount', { count: violations.length })
                : t('allClear')}
            </small>
          </div>
        </div>
        <ul aria-label={t('ruleCheck')}>
          {violations.length ? (
            violations.map(({ first, second }) => (
              <li key={`${first.id}-${second.id}`}>
                {t('violation', {
                  first: t(EQUIPMENT[first.type].nameKey),
                  second: t(EQUIPMENT[second.type].nameKey),
                })}
              </li>
            ))
          ) : (
            <li className='ce-rule-clear'>{t('noViolations')}</li>
          )}
        </ul>
      </div>
    </section>
  )
}
