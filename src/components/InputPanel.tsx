import { useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Briefcase,
  Code2,
  Eraser,
  FileSearch,
  FileUp,
  FileText,
  FlaskConical,
  GitBranch,
  LayoutGrid,
  Loader2,
  Megaphone,
  Palette,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { COMPETENCY_DOMAINS, JOB_CATEGORIES } from '../lib/constants'
import { extractResumeText } from '../lib/fileParser'
import type { LucideIcon } from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  tech: Code2,
  product: LayoutGrid,
  operation: TrendingUp,
  hr: Users,
  market: Megaphone,
  design: Palette,
  general: Briefcase,
}

interface InputPanelProps {
  jd: string
  cv: string
  onJdChange: (value: string) => void
  onCvChange: (value: string) => void
  categoryId: string
  onCategoryChange: (id: string) => void
  loading: boolean
  onGenerate: () => void
  onLoadDemo: () => void
  onClear: () => void
}

const PIPELINE = [
  { icon: FileSearch, label: '证据抽取' },
  { icon: GitBranch, label: '胜任力映射' },
  { icon: Scale, label: '加权评分' },
  { icon: Brain, label: 'BEI 出题' },
]

export function InputPanel({
  jd,
  cv,
  onJdChange,
  onCvChange,
  categoryId,
  onCategoryChange,
  loading,
  onGenerate,
  onLoadDemo,
  onClear,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedFile, setParsedFile] = useState('')
  const [parseError, setParseError] = useState('')
  const [dragging, setDragging] = useState(false)

  const canGenerate =
    !loading &&
    !parsing &&
    jd.trim().length >= 20 &&
    cv.trim().length >= 20

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setParseError('')
    setParsing(true)
    try {
      const result = await extractResumeText(file)
      onCvChange(result.text)
      setParsedFile(`${result.fileName} · ${result.fileType} · ${result.text.length} 字`)
    } catch (err) {
      setParsedFile('')
      setParseError(err instanceof Error ? err.message : '文件解析失败')
    } finally {
      setParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <aside className="panel flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">候选人信息输入</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/20 disabled:opacity-50"
            title="按当前岗位类别加载示例 JD 与简历"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            加载示例数据
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-fg-faint transition hover:bg-fg/5 hover:text-fg-soft disabled:opacity-50"
            title="清空全部输入"
          >
            <Eraser className="h-3.5 w-3.5" />
            清空
          </button>
        </div>
      </div>

      {/* 岗位类别 */}
      <section>
        <span className="field-label mb-2.5">
          <Briefcase className="h-3.5 w-3.5 text-brand" />
          岗位类别
          <span className="text-fg-faint">· 评估维度随类别自动切换</span>
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {JOB_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id] ?? Briefcase
            const active = cat.id === categoryId
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                title={cat.description}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition ${
                  active
                    ? 'border-brand/40 bg-brand/10 text-fg'
                    : 'border-line bg-fg/[0.02] text-fg-faint hover:border-fg/20 hover:text-fg-soft'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-brand' : ''}`} />
                <span className="text-[11px] font-medium leading-none">
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-fg-faint">
          {JOB_CATEGORIES.find((c) => c.id === categoryId)?.description}
        </p>
      </section>

      {/* JD */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="jd-input" className="field-label">
            <FileText className="h-3.5 w-3.5 text-brand" />
            岗位描述（JD）
          </label>
          <span className="text-[11px] tabular-nums text-fg-faint">
            {jd.length} 字
          </span>
        </div>
        <textarea
          id="jd-input"
          className="input-base min-h-[150px]"
          placeholder="请粘贴目标岗位的 Job Description，包括岗位职责、任职要求与加分项…"
          value={jd}
          onChange={(e) => onJdChange(e.target.value)}
        />
      </section>

      {/* CV */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="cv-input" className="field-label">
            <FileText className="h-3.5 w-3.5 text-brand-soft" />
            候选人简历（CV）
          </label>
          <span className="text-[11px] tabular-nums text-fg-faint">
            {cv.length} 字
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void handleFile(e.dataTransfer.files?.[0])
          }}
          className={`mb-2 flex items-center justify-between gap-3 rounded-xl border border-dashed px-3.5 py-2.5 transition ${
            dragging
              ? 'border-brand bg-brand/10'
              : 'border-fg/20 bg-ink-950/40 hover:border-fg/35'
          }`}
        >
          <div className="flex min-w-0 items-center gap-2.5 text-xs text-fg-soft">
            {parsing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
            ) : (
              <FileUp className="h-4 w-4 shrink-0 text-fg-faint" />
            )}
            <span className="truncate">
              {parsing
                ? '正在本地解析简历文件…'
                : parsedFile
                  ? parsedFile
                  : '上传 PDF / Word（.docx）自动提取文本，或拖拽至此'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="shrink-0 rounded-lg border border-line bg-fg/[0.05] px-2.5 py-1.5 text-xs font-medium text-fg-soft transition hover:bg-fg/10 disabled:opacity-50"
          >
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
        {parseError && (
          <p className="mb-2 flex items-start gap-1.5 rounded-lg border border-amber-600/25 bg-amber-600/10 px-2.5 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {parseError}
          </p>
        )}
        <textarea
          id="cv-input"
          className="input-base min-h-[180px]"
          placeholder="粘贴简历纯文本，或通过上方按钮上传文件自动解析…"
          value={cv}
          onChange={(e) => {
            onCvChange(e.target.value)
            setParsedFile('')
          }}
        />
      </section>

      {/* 胜任力评估框架（固定四域模型，自动按 JD 构建画像，无需勾选） */}
      <section>
        <span className="field-label mb-2.5">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          胜任力评估框架
          <span className="text-fg-faint">· I-O Psychology · 证据导向</span>
        </span>

        {/* 评估流水线 */}
        <div className="mb-2 flex items-center justify-between gap-1 rounded-xl border border-line bg-fg/[0.02] px-2.5 py-2">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <step.icon className="h-4 w-4 text-brand/90" />
                <span className="text-[10px] leading-none text-fg-faint">
                  {step.label}
                </span>
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="mx-0.5 h-3 w-3 shrink-0 text-fg-faint/50" />
              )}
            </div>
          ))}
        </div>

        {/* 四大域权重 */}
        <div className="grid grid-cols-2 gap-1.5">
          {COMPETENCY_DOMAINS.map((d) => (
            <div
              key={d.id}
              title={d.description}
              className="rounded-lg border border-line/70 bg-fg/[0.02] px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[12px] font-medium text-fg-soft">
                  {d.label}
                </span>
                <span className="shrink-0 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                  {d.weight}%
                </span>
              </div>
              <div className="mt-0.5 truncate text-[10px] text-fg-faint">
                {d.enLabel}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-fg-faint">
          评分必须由简历行为证据支撑，禁止仅凭关键词、学校、公司或年限打分；雷达固定六维：专业深度/广度、学习敏捷、问题解决、执行交付、协作影响。
        </p>
      </section>

      {/* 生成按钮 */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="btn-primary mt-auto w-full !py-3 text-[15px]"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            正在生成智能评估报告…
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            生成智能评估报告
          </>
        )}
      </button>
      {!loading && (jd.trim().length < 20 || cv.trim().length < 20) && (
        <p className="-mt-3 text-center text-[11px] text-fg-faint">
          请填写 JD 与简历（各至少 20 字）后开始评估
        </p>
      )}
    </aside>
  )
}
