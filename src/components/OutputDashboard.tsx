import { useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Copy,
  CornerDownRight,
  Download,
  FileSearch,
  Loader2,
  MessagesSquare,
  ShieldAlert,
} from 'lucide-react'
import type { Assessment, CompetencyDimension } from '../types'
import { PROVIDERS } from '../lib/constants'
import { ScoreRing } from './ScoreRing'
import { RadarChart } from './RadarChart'
import {
  buildMarkdown,
  copyText,
  downloadMarkdown,
} from '../lib/exportMarkdown'

interface OutputDashboardProps {
  assessment: Assessment | null
  loading: boolean
  error: string | null
  jd: string
  dimensions: CompetencyDimension[]
  onRetry: () => void
}

function bandColor(score: number) {
  if (score >= 85) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (score >= 70) return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  if (score >= 60) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
}

function barColor(score: number) {
  if (score >= 85) return 'from-emerald-400 to-teal-500'
  if (score >= 70) return 'from-blue-400 to-indigo-500'
  if (score >= 60) return 'from-amber-400 to-orange-500'
  return 'from-rose-400 to-red-500'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

export function OutputDashboard({
  assessment,
  loading,
  error,
  jd,
  dimensions,
  onRetry,
}: OutputDashboardProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    if (!assessment) return
    const md = buildMarkdown(assessment, jd, dimensions)
    const stamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace(/[-T:]/g, '')
    downloadMarkdown(`AI人才评估报告_${stamp}.md`, md)
  }

  const handleCopy = async () => {
    if (!assessment) return
    await copyText(buildMarkdown(assessment, jd, dimensions))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="flex min-w-0 flex-col gap-5">
      {/* 标题栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">智能评估结果</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            胜任力模型评分 · 亮点 / 风险识别 · STAR 定制化面试提问
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!assessment || loading}
            className="btn-ghost !px-3 !py-2 text-xs disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                复制 Markdown
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!assessment || loading}
            className="btn-primary !px-3.5 !py-2 text-xs disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            导出报告
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="panel flex flex-col items-center gap-3 border-rose-500/20 bg-rose-500/[0.05] px-8 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
          </div>
          <p className="max-w-md text-sm leading-relaxed text-rose-200/90">
            {error}
          </p>
          <button type="button" onClick={onRetry} className="btn-ghost mt-1 text-xs">
            重新尝试
          </button>
        </div>
      ) : !assessment ? (
        <EmptyState />
      ) : (
        <div key={assessment.generatedAt} className="flex flex-col gap-5">
          {/* 评分 + 雷达 */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
            <div className="panel flex animate-fade-up flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
              <ScoreRing score={assessment.score} />
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {assessment.categoryLabel && (
                    <span className="chip border border-sky-500/30 bg-sky-500/10 text-sky-300">
                      {assessment.categoryLabel}
                    </span>
                  )}
                  <span
                    className={`chip border ${bandColor(assessment.score)}`}
                  >
                    {assessment.band}
                  </span>
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-100">
                  {assessment.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    服务商：
                    <span className="text-slate-400">
                      {PROVIDERS[assessment.provider].label}
                    </span>
                  </span>
                  <span>
                    模型：<span className="font-mono text-slate-400">{assessment.model}</span>
                  </span>
                  <span>{formatTime(assessment.generatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="panel animate-fade-up p-5" style={{ animationDelay: '60ms' }}>
              <h3 className="mb-1 text-[13px] font-semibold text-white">
                胜任力雷达
              </h3>
              <RadarChart scores={assessment.dimensionScores} />
              <div className="mt-2 space-y-2.5">
                {assessment.dimensionScores.map((s) => (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{s.label}</span>
                      <span className="font-semibold tabular-nums text-slate-200">
                        {s.score}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${barColor(s.score)}`}
                        style={{
                          width: `${s.score}%`,
                          transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 亮点 */}
          <div className="panel animate-fade-up p-5" style={{ animationDelay: '120ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-white">
              <BadgeCheck className="h-5 w-5 text-emerald-400" />
              核心优势 Highlights
              <span className="text-xs font-normal text-slate-600">
                · 简历中 3 个最强匹配证据
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {assessment.highlights.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 transition hover:bg-emerald-500/[0.09]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-[11px] font-bold text-emerald-300">
                      {i + 1}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/80">
                      Strength
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-slate-200">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 风险 */}
          <div className="panel animate-fade-up p-5" style={{ animationDelay: '180ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-white">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              潜在风险与待核实疑点 Risks
              <span className="text-xs font-normal text-slate-600">
                · 建议在面试中重点验证
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {assessment.risks.map((risk, i) => {
                const critical = risk.severity === 'critical'
                return (
                  <div
                    key={i}
                    className={`flex gap-3 rounded-xl border p-4 ${
                      critical
                        ? 'border-rose-500/25 bg-rose-500/[0.06]'
                        : 'border-amber-500/25 bg-amber-500/[0.06]'
                    }`}
                  >
                    {critical ? (
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                    )}
                    <div>
                      <span
                        className={`chip mb-2 border ${
                          critical
                            ? 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                            : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {critical ? '重点核实' : '建议关注'}
                      </span>
                      <p className="text-[13px] leading-relaxed text-slate-200">
                        {risk.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* STAR 提问库 */}
          <div
            className="panel animate-fade-up p-5"
            style={{ animationDelay: '240ms' }}
          >
            <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-white">
              <MessagesSquare className="h-5 w-5 text-blue-400" />
              STAR 定制化行为面试提问库
            </h3>
            <p className="mb-5 text-xs text-slate-500">
              基于候选人项目经历与简历疑点生成，按 Situation → Task → Action
              → Result 结构引导回答
            </p>
            <div className="space-y-4">
              {assessment.questions.map((q, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 pl-5 transition hover:border-blue-500/30"
                >
                  <span className="absolute left-0 top-4 h-[calc(100%-2rem)] w-[3px] rounded-r bg-gradient-to-b from-blue-500 to-indigo-500" />
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-xs font-bold text-blue-300">
                      Q{i + 1}
                    </span>
                    <span className="chip border border-violet-500/30 bg-violet-500/10 text-violet-300">
                      {q.dimension}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-100">
                    {q.question}
                  </p>
                  <div className="mt-3 flex gap-2 rounded-lg border border-white/[0.06] bg-ink-950/50 px-3 py-2.5">
                    <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <p className="text-xs leading-relaxed text-slate-400">
                      <span className="font-medium text-slate-300">追问建议：</span>
                      {q.followUp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center px-8 py-20 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/[0.08]">
          <FileSearch className="h-8 w-8 text-blue-400" />
        </div>
        <div className="absolute -inset-3 -z-10 rounded-full bg-blue-500/10 blur-2xl" />
      </div>
      <h3 className="text-base font-semibold text-white">
        等待生成第一份评估报告
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        在左侧粘贴 JD 与候选人简历、勾选评估维度后点击「生成智能评估报告」；
        也可以先「加载示例数据」快速体验。
      </p>
      <div className="mt-8 grid w-full max-w-lg gap-3 sm:grid-cols-3">
        {[
          { step: '01', text: '解析 JD 与简历' },
          { step: '02', text: '胜任力模型评分' },
          { step: '03', text: '生成 STAR 提问' },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-4"
          >
            <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-sm font-bold text-transparent">
              {s.step}
            </div>
            <div className="mt-1 text-xs text-slate-400">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
        <div className="panel flex items-center gap-6 p-6">
          <div className="skeleton h-[184px] w-[184px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-24" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-2/3" />
            <div className="flex items-center gap-2 pt-2 text-xs text-blue-300/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI 正在比对岗位要求与候选人证据…
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <div className="skeleton mb-4 h-4 w-24" />
          <div className="skeleton mx-auto h-[230px] w-[230px] rounded-full opacity-40" />
        </div>
      </div>
      <div className="panel space-y-3 p-5">
        <div className="skeleton h-4 w-40" />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border border-white/[0.06] p-4">
              <div className="skeleton h-5 w-16" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      </div>
      <div className="panel space-y-3 p-5">
        <div className="skeleton h-4 w-32" />
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-white/[0.06] p-4">
            <div className="skeleton h-3.5 w-full" />
            <div className="skeleton h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
