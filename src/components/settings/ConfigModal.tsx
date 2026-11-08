import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Download, FileUp, LoaderCircle, Save, X } from 'lucide-react'
import {
  downloadDataExport,
  importDataJson,
  saveSettings,
  syncCheckinsWithGitHub,
} from '../../services/storageService'
import type { AppSettings, CheckInMap, HolidayRange, PlannerData } from '../../types'

interface ConfigModalProps {
  settings: AppSettings
  checkins: CheckInMap
  onClose: () => void
  onSettingsSaved: (settings: AppSettings) => void
  onDataImported: (data: PlannerData) => void
  onCheckinsSynced: (checkins: CheckInMap) => void
}

export default function ConfigModal({
  settings,
  checkins,
  onClose,
  onSettingsSaved,
  onDataImported,
  onCheckinsSynced,
}: ConfigModalProps) {
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [holidayName, setHolidayName] = useState('')
  const [holidayStart, setHolidayStart] = useState('')
  const [holidayEnd, setHolidayEnd] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSyncing) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSyncing, onClose])

  const update = (key: keyof AppSettings, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setNotice('')
    setError('')
  }

  const addHolidayOverride = () => {
    if (!holidayStart || !holidayEnd || holidayStart > holidayEnd) {
      setError('Choose a valid holiday start and end date.')
      return
    }
    const overrides = draft.holidayOverrides ?? []
    if (overrides.some((range) => range.startDate === holidayStart && range.endDate === holidayEnd)) {
      setError('That holiday date range has already been added.')
      return
    }
    const range: HolidayRange = {
      name: holidayName.trim() || 'Additional holiday',
      startDate: holidayStart,
      endDate: holidayEnd,
    }
    setDraft((current) => ({
      ...current,
      holidayOverrides: [...(current.holidayOverrides ?? []), range],
    }))
    setHolidayName('')
    setHolidayStart('')
    setHolidayEnd('')
    setNotice('')
    setError('')
  }

  const removeHolidayOverride = (index: number) => {
    setDraft((current) => ({
      ...current,
      holidayOverrides: (current.holidayOverrides ?? []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveSettings(draft)
    onSettingsSaved(draft)
    setNotice('Settings saved.')
    setError('')
  }

  const importFile = async (file?: File) => {
    if (!file) {
      return
    }
    setError('')
    setNotice('')
    try {
      const data = importDataJson(await file.text())
      setDraft(data.settings)
      onDataImported(data)
      setNotice('Data imported and saved.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed. Check the selected file.')
    }
  }

  const sync = async () => {
    setIsSyncing(true)
    setError('')
    setNotice('')
    try {
      const synced = await syncCheckinsWithGitHub(draft, checkins)
      onCheckinsSynced(synced)
      setNotice('GitHub sync completed.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'GitHub sync failed.')
    } finally {
      setIsSyncing(false)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSyncing) {
          onClose()
        }
      }}
    >
      <section
        className="checkin-modal config-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="config-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">PERSONALIZE YOUR PLANNER</p>
            <h2 id="config-title">Settings & Data</h2>
            <p className="modal-date">Configure practice links and manage your data across devices.</p>
          </div>
          <button type="button" className="icon-button close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save} className="config-form">
          <div className="modal-content config-content">
            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>Practice websites</h3>
                  <p>Task cards open the configured website for each activity.</p>
                </div>
              </div>
              <div className="config-fields">
                <label className="field-label">
                  SpellingBee base URL
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/SpellingBee"
                    value={draft.spellingBeeBaseUrl}
                    onChange={(event) => update('spellingBeeBaseUrl', event.target.value)}
                  />
                </label>
                <label className="field-label">
                  Coaching portal URL
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={draft.coachingPortalUrl}
                    onChange={(event) => update('coachingPortalUrl', event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>Holiday date overrides</h3>
                  <p>Additional dates use the holiday study schedule. Official NSW holiday dates remain active.</p>
                </div>
              </div>
              <div className="holiday-override-form">
                <label className="field-label holiday-name">
                  Holiday name
                  <input
                    type="text"
                    placeholder="e.g. Family trip"
                    value={holidayName}
                    onChange={(event) => setHolidayName(event.target.value)}
                  />
                </label>
                <label className="field-label">
                  Start date
                  <input
                    type="date"
                    value={holidayStart}
                    onChange={(event) => setHolidayStart(event.target.value)}
                  />
                </label>
                <label className="field-label">
                  End date
                  <input
                    type="date"
                    value={holidayEnd}
                    onChange={(event) => setHolidayEnd(event.target.value)}
                  />
                </label>
                <button type="button" className="secondary-button" onClick={addHolidayOverride}>
                  Add date range
                </button>
              </div>
              {(draft.holidayOverrides ?? []).length > 0 && (
                <div className="holiday-override-list">
                  {(draft.holidayOverrides ?? []).map((range, index) => (
                    <div className="holiday-override-item" key={`${range.startDate}-${range.endDate}`}>
                      <span>
                        <strong>{range.name}</strong>
                        <small>{range.startDate} – {range.endDate}</small>
                      </span>
                      <button
                        type="button"
                        className="text-button danger-text"
                        onClick={() => removeHolidayOverride(index)}
                        aria-label={`Remove ${range.name}`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>GitHub sync</h3>
                  <p>Sync check-ins with data/checkins.json in your repository.</p>
                </div>
              </div>
              <div className="config-fields">
                <label className="field-label">
                  Repository (owner/repository)
                  <input
                    type="text"
                    placeholder="username/oc-prep-tracker"
                    value={draft.githubRepo ?? ''}
                    onChange={(event) => update('githubRepo', event.target.value)}
                  />
                </label>
                <label className="field-label">
                  Personal access token
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Stored only in this browser"
                    value={draft.githubToken ?? ''}
                    onChange={(event) => update('githubToken', event.target.value)}
                  />
                </label>
              </div>
              <button
                type="button"
                className="secondary-button sync-button"
                onClick={sync}
                disabled={isSyncing}
              >
                {isSyncing ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
                {isSyncing ? 'Syncing…' : 'Sync check-ins now'}
              </button>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>Backup & restore</h3>
                  <p>Export check-ins and settings to JSON, or restore them from a backup.</p>
                </div>
              </div>
              <div className="data-actions">
                <button type="button" className="secondary-button" onClick={() => downloadDataExport()}>
                  <Download size={15} /> Export JSON
                </button>
                <label className="secondary-button file-import">
                  <FileUp size={15} /> Import JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(event) => {
                      void importFile(event.target.files?.[0])
                      event.currentTarget.value = ''
                    }}
                  />
                </label>
              </div>
            </section>
            {notice && <p className="config-notice" role="status">{notice}</p>}
            {error && <p className="form-error config-error" role="alert">{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Close</button>
            <button type="submit" className="primary-button"><Save size={15} /> Save settings</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}
