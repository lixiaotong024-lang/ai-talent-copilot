import { BrainCircuit, KeyRound, Settings2 } from 'lucide-react'
import type { ApiSettings } from '../types'
import { GITHUB_URL, PROVIDERS } from '../lib/constants'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

interface TopNavProps {
  settings: ApiSettings
  onOpenSettings: () => void
}

export function TopNav({ settings, onOpenSettings }: TopNavProps) {
  const isDemo = settings.provider === 'demo'
  const hasKey =
    isDemo || Boolean(settings.configs[settings.provider].apiKey.trim())
  const providerLabel = PROVIDERS[settings.provider].label

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand shadow-glow">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-fg">
              AI Talent Copilot
              <span className="ml-2 hidden text-xs font-normal text-fg-faint sm:inline">
                Psychology &amp; Sourcing Edition
              </span>
            </h1>
            <p className="hidden text-[11px] text-fg-faint md:block">
              胜任力模型 × STAR 行为面试 · 大模型驱动的技术招聘初筛助手
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className="hidden items-center gap-2 rounded-full border border-line bg-fg/[0.04] px-3 py-1.5 text-xs text-fg-soft sm:flex"
            title={`当前服务商：${providerLabel}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasKey
                  ? 'bg-emerald-600 dark:bg-emerald-400'
                  : 'bg-amber-600 dark:bg-amber-400'
              }`}
            />
            {isDemo
              ? '免费体验模式 · 本地模拟'
              : hasKey
                ? `${providerLabel} 已连接`
                : '未配置 API Key'}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-ghost !px-3 !py-2"
            title="API Key 设置"
          >
            {hasKey ? (
              <Settings2 className="h-4 w-4" />
            ) : (
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden text-sm sm:inline">API 设置</span>
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-fg/[0.04] text-fg-soft transition hover:border-fg/20 hover:bg-fg/[0.08] hover:text-fg"
            title="GitHub"
          >
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </header>
  )
}
