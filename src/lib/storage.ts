const CONFIG_KEY = 'tips-studio:provider-config'
const HISTORY_KEY = 'tips-studio:history'

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const loadProviderConfig = () => readJson(CONFIG_KEY, null)
export const saveProviderConfig = (value: unknown) => writeJson(CONFIG_KEY, value)
export const loadHistory = () => readJson(HISTORY_KEY, [])
export const saveHistory = (value: unknown) => writeJson(HISTORY_KEY, value)
