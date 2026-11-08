import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Download, FileUp, LoaderCircle, Save, X } from 'lucide-react'
import {
  downloadDataExport,
  importDataJson,
  saveSettings,
  syncCheckinsWithGitHub,
} from '../../services/storageService'
import type { AppSettings, CheckInMap, PlannerData } from '../../types'

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

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveSettings(draft)
    onSettingsSaved(draft)
    setNotice('设置已保存。')
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
      setNotice('数据已导入并保存。')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导入失败，请检查文件内容。')
    }
  }

  const sync = async () => {
    setIsSyncing(true)
    setError('')
    setNotice('')
    try {
      const synced = await syncCheckinsWithGitHub(draft, checkins)
      onCheckinsSynced(synced)
      setNotice('GitHub 同步完成。')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'GitHub 同步失败。')
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
            <h2 id="config-title">设置与数据</h2>
            <p className="modal-date">配置练习网站并管理跨设备数据。</p>
          </div>
          <button type="button" className="icon-button close-modal" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save} className="config-form">
          <div className="modal-content config-content">
            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>外部练习网站</h3>
                  <p>任务卡会根据任务类型跳转到相应网站。</p>
                </div>
              </div>
              <div className="config-fields">
                <label className="field-label">
                  SpellingBee 基础网址
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/SpellingBee"
                    value={draft.spellingBeeBaseUrl}
                    onChange={(event) => update('spellingBeeBaseUrl', event.target.value)}
                  />
                </label>
                <label className="field-label">
                  OC 机构做题网站
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
                  <h3>GitHub 跨设备同步</h3>
                  <p>将打卡记录同步到仓库中的 data/checkins.json。</p>
                </div>
              </div>
              <div className="config-fields">
                <label className="field-label">
                  仓库（owner/repository）
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
                    placeholder="仅保存在当前浏览器"
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
                {isSyncing ? '同步中…' : '立即同步打卡数据'}
              </button>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>备份与恢复</h3>
                  <p>导出包含打卡和设置的 JSON 文件，或从备份恢复。</p>
                </div>
              </div>
              <div className="data-actions">
                <button type="button" className="secondary-button" onClick={() => downloadDataExport()}>
                  <Download size={15} /> 导出 JSON
                </button>
                <label className="secondary-button file-import">
                  <FileUp size={15} /> 导入 JSON
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
            <button type="button" className="secondary-button" onClick={onClose}>关闭</button>
            <button type="submit" className="primary-button"><Save size={15} /> 保存设置</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}
