import { cn } from './ui'
import type { ScenePalette } from '@/types'

/* 稳定的伪随机，用于生成山脉轮廓 */
const rng = (seed: number) => {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const ridgePath = (seed: number, baseY: number, amp: number, step = 26) => {
  const rand = rng(seed)
  let d = `M0 200 L0 ${baseY}`
  for (let x = 0; x <= 400; x += step) {
    const y = baseY - amp * (0.35 + rand() * 0.65)
    d += ` L${x} ${y.toFixed(1)}`
  }
  d += ` L400 200 Z`
  return d
}

const Pine = ({ x, y, h, fill }: { x: number; y: number; h: number; fill: string }) => (
  <g fill={fill}>
    <path d={`M${x} ${y - h} L${x + h * 0.3} ${y - h * 0.45} L${x - h * 0.3} ${y - h * 0.45} Z`} />
    <path d={`M${x} ${y - h * 0.72} L${x + h * 0.4} ${y - h * 0.2} L${x - h * 0.4} ${y - h * 0.2} Z`} />
    <rect x={x - h * 0.04} y={y - h * 0.22} width={h * 0.08} height={h * 0.24} />
  </g>
)

export function Scene({
  palette,
  className,
  seed = 7,
  quiet = false,
}: {
  palette: ScenePalette
  className?: string
  seed?: number
  /** 关闭装饰剪影，用于需要更安静的背景 */
  quiet?: boolean
}) {
  const rand = rng(seed + 13)
  const skyId = `sky-${seed}-${palette.kind}`
  const sunId = `sun-${seed}-${palette.kind}`
  const groundId = `gnd-${seed}-${palette.kind}`
  const showSun = palette.kind !== 'ash'

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={cn('absolute inset-0 h-full w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
        <radialGradient id={sunId}>
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.85" />
          <stop offset="55%" stopColor={palette.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ground} />
          <stop offset="100%" stopColor="#0a0705" />
        </linearGradient>
      </defs>

      <rect width="400" height="200" fill={`url(#${skyId})`} />

      {showSun && (
        <>
          <circle cx={300 - (seed % 5) * 22} cy="52" r="58" fill={`url(#${sunId})`} />
          <circle cx={300 - (seed % 5) * 22} cy="52" r="7" fill={palette.accent} opacity="0.6" />
        </>
      )}

      {/* 远景 */}
      <path d={ridgePath(seed + 1, 150, 58)} fill={palette.far} />
      {/* 中景 */}
      <path d={ridgePath(seed + 2, 168, 42)} fill={palette.mid} />

      {/* 中景剪影 */}
      {!quiet && (palette.kind === 'pine' || palette.kind === 'forest' || palette.kind === 'snow') && (
        <g>
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 12 + i * 46 + rand() * 16
            const h = 22 + rand() * 20
            return <Pine key={i} x={x} y={182} h={h} fill={palette.mid} />
          })}
        </g>
      )}
      {!quiet && palette.kind === 'tundra' && (
        <g fill={palette.mid}>
          <rect x="150" y="120" width="10" height="46" />
          <rect x="176" y="132" width="8" height="34" />
          <path d="M142 122 L155 106 L168 122 Z" />
          <path d="M170 134 L180 120 L190 134 Z" />
          <rect x="248" y="126" width="46" height="40" />
          <path d="M244 126 L271 108 L298 126 Z" />
        </g>
      )}
      {!quiet && palette.kind === 'ash' && (
        <g fill={palette.mid}>
          <path d="M40 186 L52 100 L64 186 Z" />
          <path d="M300 186 L314 118 L328 186 Z" />
          <path d="M180 186 L190 130 L200 186 Z" />
        </g>
      )}
      {!quiet && palette.kind === 'marsh' && (
        <g stroke={palette.mid} strokeWidth="2" fill="none">
          <path d="M60 186 L62 140 M62 152 L52 144 M62 158 L72 148" />
          <path d="M240 186 L238 132 M238 146 L228 138 M238 152 L248 142" />
        </g>
      )}

      {/* 近景 */}
      <path d={ridgePath(seed + 3, 182, 24, 34)} fill={palette.near} />
      <rect y="184" width="400" height="16" fill={`url(#${groundId})`} />

      {/* 大气雾与暗角 */}
      <rect width="400" height="200" fill={palette.skyBottom} opacity="0.12" />
    </svg>
  )
}

/** 用于卡片顶部的小型场景条 */
export function SceneStrip({
  palette,
  seed = 3,
  className,
}: {
  palette: ScenePalette
  seed?: number
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Scene palette={palette} seed={seed} quiet />
      <div className="absolute inset-0 bg-gradient-to-t from-coal/95 via-coal/25 to-transparent" />
    </div>
  )
}
