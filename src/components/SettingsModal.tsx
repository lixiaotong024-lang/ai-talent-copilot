import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  ExternalLink,
  FlaskConical,
  KeyRound,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type { ApiSettings, ProviderId } from '../types'
import { PROVIDER_ORDER, PROVIDERS } from '../lib/constants'

interface SettingsModalProps {
  open: boolean
  settings: ApiSettings
  onClose: () => void
  onSave: (settings: ApiSettings) => void
}

export function SettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [draft, setDraft] = useState<ApiSettings>(settings)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setShowKey(false)
    }
  }, [open, settings])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const providerId = draft.provider
  const meta = PROVIDERS[providerId]
  const creds = draft.configs[providerId]

  const update = (patch: Partial<(typeof draft.configs)[ProviderId]>) => {
    setDraft((prev) => ({
      ...prev,
      configs: {
        ...prev.configs,
        [providerId]: { ...prev.configs[providerId], ...patch },
      },
    }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="panel relative w-full max-w-lg animate-fade-up overflow-hidden bg-ink-900/95 p-0">
        <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2
              id="settings-title"
              className="flex items-center gap-2 text-base font-semibold text-white"
            >
              <KeyRound className="h-5 w-5 text-blue-400" />
              大模型 API 配置
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              所有凭证仅保存在当前浏览器 localStorage，请求由浏览器直连服务商
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* 服务商切换 */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-ink-950/60 p-1">
            {PROVIDER_ORDER.map((id) => {
              const active = id === providerId
              const configured = Boolean(draft.configs[id].apiKey.trim())
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setDraft((prev) => ({ ...prev, provider: id }))
                    setShowKey(false)
                  }}
                  className={`relative rounded-lg px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'bg-blue-600/90 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {PROVIDERS[id].label}
                  {configured && (
                    <span
                      className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${
                        active ? 'bg-white' : 'bg-emerald-400'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {providerId === 'demo' ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-4">
                <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div className="text-xs leading-relaxed text-emerald-100/85">
                  <p className="mb-1 text-sm font-semibold text-emerald-200">
                    免费体验模式已就绪
                  </p>
                  无需注册、无需 API Key、不产生任何费用。点击「保存配置」后，
                  在左侧粘贴任意 JD 与简历（或加载示例数据），即可生成完整的仿真评估报告。
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-xs leading-relaxed text-slate-400">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <div>
                  <p className="mb-1 font-medium text-slate-300">实现方式</p>
                  评估由浏览器内置的本地启发式引擎根据 JD↔简历的技能词覆盖度、
                  学历/论文/开源/协作/抗压等经历信号即时生成，全程不发送网络请求。
                  体验真实 AI 分析深度时，切换到上方 DeepSeek / OpenAI / Kimi
                  并填入你自己的 Key 即可（Key 仅存储于本机）。
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* API Key */}
          <div>
            <label className="field-label mb-2" htmlFor="api-key">
              API Key
              <span className="text-slate-600">· 仅本地存储，不上传任何服务器</span>
            </label>
            <div className="relative">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                className="input-base pr-11 font-mono"
                placeholder={meta.keyHint}
                value={creds.apiKey}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => update({ apiKey: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                aria-label={showKey ? '隐藏 Key' : '显示 Key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* 模型 */}
          <div>
            <label className="field-label mb-2" htmlFor="model-name">
              模型名称
              <span className="text-slate-600">
                · 留空使用默认 {meta.defaultModel}
              </span>
            </label>
            <input
              id="model-name"
              className="input-base font-mono"
              placeholder={meta.defaultModel}
              value={creds.model}
              spellCheck={false}
              onChange={(e) => update({ model: e.target.value })}
            />
          </div>

          {/* 自定义 Base URL */}
          <div>
            <label className="field-label mb-2" htmlFor="base-url">
              接口 Base URL（可选）
              <span className="text-slate-600">· 遇到 CORS 限制时可填中转地址</span>
            </label>
            <input
              id="base-url"
              className="input-base font-mono text-xs"
              placeholder={new URL(meta.endpoint).origin + '/v1'}
              value={creds.baseUrl}
              spellCheck={false}
              onChange={(e) => update({ baseUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <a
              href={meta.keyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-blue-400 transition hover:text-blue-300"
            >
              获取 API Key <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-blue-400 transition hover:text-blue-300"
            >
              接口文档 <ExternalLink className="h-3 w-3" />
            </a>
          </div>
            </>
          )}

          <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.07] px-3.5 py-3 text-xs leading-relaxed text-blue-200/80">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
            <span>
              本应用为纯前端应用，API Key 通过浏览器 localStorage
              保存在你的设备上，刷新页面不会丢失；清除浏览器数据或在系统设置中删除即可完全移除。
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onSave(draft)
              onClose()
            }}
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
