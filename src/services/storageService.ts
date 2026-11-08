import type { AppSettings, CheckInMap, PlannerData } from '../types'

const CHECKINS_KEY = 'oc-prep-tracker:checkins'
const SETTINGS_KEY = 'oc-prep-tracker:settings'
const DEFAULT_SETTINGS: AppSettings = {
  spellingBeeBaseUrl: 'https://yuliuftd.github.io/SpellingBee',
  coachingPortalUrl: '',
}

interface GitHubContentResponse {
  sha: string
  content: string
}

export function getCheckins(): CheckInMap {
  return readJson<CheckInMap>(CHECKINS_KEY, {})
}

export function saveCheckins(checkins: CheckInMap): void {
  window.localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins))
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) }
}

export function saveSettings(settings: AppSettings): void {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function createDataExport(
  checkins: CheckInMap = getCheckins(),
  settings: AppSettings = getSettings(),
): string {
  return JSON.stringify({ checkins, settings } satisfies PlannerData, null, 2)
}

export function downloadDataExport(filename = 'oc-prep-tracker-data.json'): void {
  const blob = new Blob([createDataExport()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function importDataJson(json: string): PlannerData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new Error('The selected file is not valid JSON.', { cause: error })
  }
  if (!isPlannerData(parsed)) {
    throw new Error('The selected file does not contain valid checkins and settings.')
  }
  saveCheckins(parsed.checkins)
  saveSettings(parsed.settings)
  return parsed
}

export async function syncCheckinsWithGitHub(
  settings: AppSettings = getSettings(),
  localCheckins: CheckInMap = getCheckins(),
): Promise<CheckInMap> {
  const token = settings.githubToken?.trim()
  const repo = settings.githubRepo?.trim()
  if (!token || !repo) {
    throw new Error('GitHub sync requires both a personal access token and owner/repository.')
  }

  const [owner, repository, ...extra] = repo.split('/')
  if (!owner || !repository || extra.length > 0) {
    throw new Error('GitHub repository must use the owner/repository format.')
  }

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/data/checkins.json`
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const remote = await fetchRemoteCheckins(endpoint, headers)
  const merged: CheckInMap = { ...(remote?.checkins ?? {}), ...localCheckins }

  const body: {
    message: string
    content: string
    sha?: string
  } = {
    message: 'Sync OC prep tracker check-ins',
    content: encodeBase64(JSON.stringify(merged, null, 2)),
  }
  if (remote) {
    body.sha = remote.sha
  }

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`GitHub sync failed (${response.status}): ${await response.text()}`)
  }

  saveCheckins(merged)
  return merged
}

function readJson<T>(key: string, fallback: T): T {
  const stored = window.localStorage.getItem(key)
  if (stored === null) {
    return fallback
  }
  try {
    return JSON.parse(stored) as T
  } catch (error) {
    throw new Error(`Stored data for "${key}" is invalid JSON.`, { cause: error })
  }
}

function isPlannerData(value: unknown): value is PlannerData {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<PlannerData>
  return (
    typeof candidate.checkins === 'object' &&
    candidate.checkins !== null &&
    !Array.isArray(candidate.checkins) &&
    typeof candidate.settings === 'object' &&
    candidate.settings !== null &&
    typeof candidate.settings.spellingBeeBaseUrl === 'string' &&
    typeof candidate.settings.coachingPortalUrl === 'string'
  )
}

async function fetchRemoteCheckins(
  endpoint: string,
  headers: Record<string, string>,
): Promise<{ checkins: CheckInMap; sha: string } | undefined> {
  const response = await fetch(endpoint, { headers })
  if (response.status === 404) {
    return undefined
  }
  if (!response.ok) {
    throw new Error(`GitHub sync failed (${response.status}): ${await response.text()}`)
  }

  const file = (await response.json()) as GitHubContentResponse
  try {
    const content = decodeBase64(file.content.replace(/\s/g, ''))
    const checkins: unknown = JSON.parse(content)
    if (typeof checkins !== 'object' || checkins === null || Array.isArray(checkins)) {
      throw new Error('Remote check-in data must be a JSON object.')
    }
    return { checkins: checkins as CheckInMap, sha: file.sha }
  } catch (error) {
    throw new Error('Could not read check-ins from the GitHub repository.', { cause: error })
  }
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function decodeBase64(value: string): string {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
