import type { ApiSettings } from '../types'
import { DEFAULT_SETTINGS } from './constants'

const STORAGE_KEY = 'ai-talent-copilot:settings:v1'

export function loadSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_SETTINGS)
    const parsed = JSON.parse(raw) as Partial<ApiSettings>
    // 合并默认值，避免版本升级后字段缺失
    return {
      provider:
        parsed.provider && parsed.provider in DEFAULT_SETTINGS.configs
          ? parsed.provider
          : DEFAULT_SETTINGS.provider,
      configs: {
        demo: { ...DEFAULT_SETTINGS.configs.demo, ...parsed.configs?.demo },
        deepseek: { ...DEFAULT_SETTINGS.configs.deepseek, ...parsed.configs?.deepseek },
        openai: { ...DEFAULT_SETTINGS.configs.openai, ...parsed.configs?.openai },
        kimi: { ...DEFAULT_SETTINGS.configs.kimi, ...parsed.configs?.kimi },
      },
    }
  } catch {
    return structuredClone(DEFAULT_SETTINGS)
  }
}

export function saveSettings(settings: ApiSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
