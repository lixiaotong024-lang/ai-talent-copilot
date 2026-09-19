import { useRef, useState } from 'react'
import { TopNav } from './components/TopNav'
import { SettingsModal } from './components/SettingsModal'
import { InputPanel } from './components/InputPanel'
import { OutputDashboard } from './components/OutputDashboard'
import { DEFAULT_CATEGORY_ID, GITHUB_URL, getCategory } from './lib/constants'
import { loadSettings, saveSettings } from './lib/storage'
import { generateAssessment, isAbortError, LlmError } from './lib/llm'
import { getDemo } from './lib/demo'
import type { ApiSettings, Assessment } from './types'

export default function App() {
  const [settings, setSettings] = useState<ApiSettings>(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [jd, setJd] = useState('')
  const [cv, setCv] = useState('')
  const [categoryId, setCategoryId] = useState(DEFAULT_CATEGORY_ID)
  const category = getCategory(categoryId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
  }

  const handleSaveSettings = (next: ApiSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  const handleLoadDemo = () => {
    const demo = getDemo(categoryId)
    setJd(demo.jd)
    setCv(demo.cv)
    setError(null)
  }

  const handleClear = () => {
    setJd('')
    setCv('')
    setError(null)
    setAssessment(null)
  }

  const runAssessment = async () => {
    if (jd.trim().length < 20 || cv.trim().length < 20) {
      setError('请先填写完整的 JD 与简历内容。')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const result = await generateAssessment({
        settings,
        jd: jd.trim(),
        cv: cv.trim(),
        categoryLabel: category.label,
        signal: controller.signal,
      })
      setAssessment(result)
    } catch (err) {
      if (isAbortError(err)) return
      const message =
        err instanceof LlmError
          ? err.message
          : err instanceof Error
            ? err.message
            : '生成评估报告时发生未知错误。'
      setError(message)
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* 背景装饰：低饱和赤陶光晕 + 细网格 */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[420px] w-[620px] rounded-full bg-brand/[0.10] blur-[120px] dark:bg-brand/[0.07]" />
        <div className="absolute -right-32 top-1/3 h-[380px] w-[520px] rounded-full bg-fg/[0.05] blur-[120px] dark:bg-fg/[0.04]" />
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.3]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--fg) / 0.045) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--fg) / 0.045) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <TopNav settings={settings} onOpenSettings={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="grid items-start gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-[88px]">
            <InputPanel
              jd={jd}
              cv={cv}
              onJdChange={setJd}
              onCvChange={setCv}
              categoryId={categoryId}
              onCategoryChange={handleCategoryChange}
              loading={loading}
              onGenerate={() => void runAssessment()}
              onLoadDemo={handleLoadDemo}
              onClear={handleClear}
            />
          </div>

          <OutputDashboard
            assessment={assessment}
            loading={loading}
            error={error}
            jd={jd}
            onRetry={() => void runAssessment()}
          />
        </div>

        <footer className="mt-10 flex flex-col items-center gap-1 border-t border-line/60 pt-6 pb-4 text-center text-[11px] text-fg-faint">
          <p>
            AI Talent Copilot · 评估结果由大模型生成，仅供 HR 初筛参考，关键信息请以面试与背调核实为准。
          </p>
          <p>
            纯前端应用 · API Key 仅存储于本地浏览器 ·{' '}
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-fg-faint underline-offset-2 transition hover:text-brand hover:underline"
            >
              GitHub
            </a>
          </p>
        </footer>
      </main>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  )
}
