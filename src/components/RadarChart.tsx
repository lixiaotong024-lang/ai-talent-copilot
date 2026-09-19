import type { CompetencyScore } from '../types'

interface RadarChartProps {
  scores: CompetencyScore[]
  size?: number
}

const CENTER = 130
const RADIUS = 82

function polar(angle: number, radius: number) {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  }
}

export function RadarChart({ scores, size = 260 }: RadarChartProps) {
  const n = scores.length
  if (n < 3) return null

  const angles = scores.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n)
  const rings = [0.25, 0.5, 0.75, 1]

  const dataPoints = scores.map((s, i) =>
    polar(angles[i], RADIUS * Math.max(0, Math.min(100, s.score)) / 100),
  )
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox="0 0 260 260"
      style={{ width: size, height: size }}
      className="mx-auto"
    >
      {/* 网格 */}
      {rings.map((ratio) => {
        const pts = angles
          .map((a) => {
            const p = polar(a, RADIUS * ratio)
            return `${p.x},${p.y}`
          })
          .join(' ')
        return (
          <polygon
            key={ratio}
            points={pts}
            fill="none"
            stroke="rgba(148,163,184,0.14)"
            strokeWidth={1}
          />
        )
      })}

      {/* 轴线 */}
      {angles.map((a, i) => {
        const p = polar(a, RADIUS)
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={p.x}
            y2={p.y}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth={1}
          />
        )
      })}

      {/* 数据多边形 */}
      <polygon
        points={polygon}
        fill="rgba(59,130,246,0.18)"
        stroke="#3b82f6"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.35))' }}
      />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="#60a5fa" />
      ))}

      {/* 标签 + 分值 */}
      {scores.map((s, i) => {
        const labelPos = polar(angles[i], RADIUS + 24)
        const cos = Math.cos(angles[i])
        const anchor =
          cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
        return (
          <g key={s.id}>
            <text
              x={labelPos.x}
              y={labelPos.y - 4}
              textAnchor={anchor}
              className="fill-slate-300 text-[10px] font-medium"
            >
              {s.label.length > 7 ? `${s.label.slice(0, 7)}…` : s.label}
            </text>
            <text
              x={labelPos.x}
              y={labelPos.y + 9}
              textAnchor={anchor}
              className="fill-blue-400 text-[10px] font-semibold"
            >
              {s.score}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
