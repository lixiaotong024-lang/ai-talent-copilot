import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  stroke?: number
}

export function ScoreRing({ score, size = 184, stroke = 13 }: ScoreRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const [offset, setOffset] = useState(circumference)

  useEffect(() => {
    const target = circumference * (1 - Math.max(0, Math.min(100, score)) / 100)
    const raf = requestAnimationFrame(() => setOffset(target))
    return () => cancelAnimationFrame(raf)
  }, [score, circumference])

  const gradientId = 'score-ring-gradient'

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(var(--brand-strong))" />
            <stop offset="55%" stopColor="rgb(var(--brand))" />
            <stop offset="100%" stopColor="rgb(var(--brand-soft))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--fg) / 0.14)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)',
            filter: 'drop-shadow(0 0 10px rgb(var(--brand) / 0.35))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums tracking-tight text-fg">
          {score}
        </span>
        <span className="mt-0.5 text-xs font-medium text-fg-faint">/ 100</span>
      </div>
    </div>
  )
}
