import type { Character, PortraitSpec, RaceId } from '@/types'
import { cn } from './ui'

/* ---------------------------------------------------------------- */
/* 种族外貌基线                                                      */
/* ---------------------------------------------------------------- */

interface RaceLook {
  skin: string
  skinShade: string
  hair: string
  eyes: string
  ears: 'round' | 'pointed' | 'cat' | 'fin'
}

export const raceLook: Record<RaceId, RaceLook> = {
  nord: { skin: '#e0b195', skinShade: '#c08a6a', hair: '#a9743a', eyes: '#41647a', ears: 'round' },
  imperial: { skin: '#d6a684', skinShade: '#b3815f', hair: '#3d2a1b', eyes: '#4c3a22', ears: 'round' },
  breton: { skin: '#e2bb9d', skinShade: '#c1936f', hair: '#6b4a2b', eyes: '#4a6b48', ears: 'round' },
  redguard: { skin: '#8d5b3b', skinShade: '#6d4227', hair: '#241811', eyes: '#2f1f14', ears: 'round' },
  altmer: { skin: '#e4cd9c', skinShade: '#c4a973', hair: '#d9cca4', eyes: '#a8b24a', ears: 'pointed' },
  bosmer: { skin: '#cda27a', skinShade: '#a97e57', hair: '#553a1f', eyes: '#7a5a2a', ears: 'pointed' },
  dunmer: { skin: '#8b95a6', skinShade: '#6a7386', hair: '#33323d', eyes: '#b8483a', ears: 'pointed' },
  orsimer: { skin: '#7f8a5c', skinShade: '#5f6a42', hair: '#26241a', eyes: '#c8b45a', ears: 'pointed' },
  khajiit: { skin: '#c8a271', skinShade: '#a37f4f', hair: '#7d5c30', eyes: '#c9a227', ears: 'cat' },
  argonian: { skin: '#6f8a6a', skinShade: '#526a4f', hair: '#3c5741', eyes: '#c9d86a', ears: 'fin' },
}

const hairPalette = ['#a9743a', '#3d2a1b', '#6b4a2b', '#241811', '#7a6248', '#b8b0a0', '#5a3a1e']
const clothPalette = ['#3f3227', '#2f3a35', '#463022', '#2c2c3a', '#54402a', '#3a2f3d']

const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 为没有手写肖像的人物推导一份确定性外观 */
export const portraitFor = (c: Character): PortraitSpec => {
  if (c.portrait) return c.portrait
  const h = hash(c.id)
  const look = raceLook[c.race]
  return {
    skin: look.skin,
    hair: h % 7 === 5 ? hairPalette[6] : look.hair,
    cloth: clothPalette[h % clothPalette.length],
    hairStyle: h % 5,
    beard: c.gender === 'male' && h % 3 === 0,
    eyes: look.eyes,
    warpaint: h % 9 === 0,
    hood: h % 11 === 0,
  }
}

export const portraitFromSeed = (seed: number, race: RaceId): PortraitSpec => {
  const look = raceLook[race]
  return {
    skin: look.skin,
    hair: hairPalette[seed % hairPalette.length],
    cloth: clothPalette[(seed >> 3) % clothPalette.length],
    hairStyle: seed % 5,
    beard: seed % 4 === 1,
    eyes: look.eyes,
    warpaint: seed % 7 === 2,
    hood: seed % 13 === 3,
  }
}

/* ---------------------------------------------------------------- */
/* 组件                                                              */
/* ---------------------------------------------------------------- */

export function Portrait({
  spec,
  race = 'nord',
  size = 96,
  className,
  square = false,
}: {
  spec: PortraitSpec
  race?: RaceId
  size?: number
  className?: string
  square?: boolean
}) {
  const look = raceLook[race]
  const skin = spec.skin || look.skin
  const skinShade = look.skinShade
  const hair = spec.hair
  const eyes = spec.eyes ?? look.eyes
  const style = spec.hairStyle % 5
  const clipId = `pc-${race}-${style}-${Math.round(size)}`

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${clipId}-bg`} cx="50%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#3b2c1f" />
          <stop offset="100%" stopColor="#120d09" />
        </radialGradient>
        <linearGradient id={`${clipId}-cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={spec.cloth} />
          <stop offset="100%" stopColor="#120d09" />
        </linearGradient>
        <clipPath id={clipId}>
          {square ? <rect x="0" y="0" width="100" height="100" rx="2" /> : <circle cx="50" cy="50" r="49" />}
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={`url(#${clipId}-bg)`} />

        {/* 肩部与衣料 */}
        <path d="M8 100 Q14 74 34 68 L66 68 Q86 74 92 100 Z" fill={`url(#${clipId}-cloth)`} />
        <path d="M34 68 Q50 78 66 68 L64 74 Q50 84 36 74 Z" fill={skinShade} opacity="0.55" />

        {/* 脖颈 */}
        <rect x="43" y="58" width="14" height="14" rx="3" fill={skinShade} />

        {/* 兜帽 */}
        {spec.hood && (
          <path d="M20 66 Q22 30 50 26 Q78 30 80 66 Q70 60 50 60 Q30 60 20 66 Z" fill={spec.cloth} opacity="0.92" />
        )}

        {/* 耳朵 */}
        {look.ears === 'pointed' && (
          <>
            <path d="M29 44 L20 34 L31 52 Z" fill={skin} />
            <path d="M71 44 L80 34 L69 52 Z" fill={skin} />
          </>
        )}
        {look.ears === 'cat' && (
          <>
            <path d="M30 40 L26 20 L42 32 Z" fill={skin} />
            <path d="M70 40 L74 20 L58 32 Z" fill={skin} />
          </>
        )}
        {look.ears === 'fin' && (
          <>
            <path d="M30 40 L22 26 L34 34 Z" fill={skinShade} />
            <path d="M70 40 L78 26 L66 34 Z" fill={skinShade} />
          </>
        )}
        {look.ears === 'round' && (
          <>
            <ellipse cx="29" cy="50" rx="3.4" ry="5" fill={skinShade} />
            <ellipse cx="71" cy="50" rx="3.4" ry="5" fill={skinShade} />
          </>
        )}

        {/* 头部 */}
        <ellipse cx="50" cy="48" rx="21" ry="24" fill={skin} />
        <path d="M50 24 Q29 26 29 48 Q29 60 36 68 Q42 72 50 72 Q58 72 64 68 Q71 60 71 48 Q71 26 50 24 Z" fill={skin} />
        {/* 明暗 */}
        <path d="M50 24 Q29 26 29 48 Q29 60 36 68 Q44 71 50 71 Z" fill={skinShade} opacity="0.18" />

        {/* 头发 */}
        {!spec.hood && style === 0 && (
          <path d="M28 44 Q28 21 50 21 Q72 21 72 44 Q66 33 50 33 Q34 33 28 44 Z" fill={hair} />
        )}
        {!spec.hood && style === 1 && (
          <>
            <path d="M28 46 Q27 20 50 20 Q73 20 72 46 Q68 31 50 31 Q32 31 28 46 Z" fill={hair} />
            <path d="M27 42 Q23 56 26 70 L33 68 Q29 54 31 43 Z" fill={hair} />
            <path d="M73 42 Q77 56 74 70 L67 68 Q71 54 69 43 Z" fill={hair} />
          </>
        )}
        {!spec.hood && style === 2 && <ellipse cx="50" cy="26" rx="7" ry="4" fill={hair} opacity="0.85" />}
        {!spec.hood && style === 3 && (
          <>
            <path d="M28 45 Q26 19 50 19 Q74 19 72 45 Q66 30 50 30 Q34 30 28 45 Z" fill={hair} />
            <path d="M62 24 Q70 12 78 20 Q70 22 66 32 Z" fill={hair} />
          </>
        )}
        {!spec.hood && style === 4 && (
          <>
            <path d="M28 46 Q28 22 50 22 Q72 22 72 46 Q64 34 50 34 Q36 34 28 46 Z" fill={hair} />
            <circle cx="50" cy="18" r="6" fill={hair} />
          </>
        )}

        {/* 眉眼 */}
        <ellipse cx="41" cy="48" rx="3.8" ry="2.2" fill="#e8ddc6" opacity="0.62" />
        <ellipse cx="59" cy="48" rx="3.8" ry="2.2" fill="#e8ddc6" opacity="0.62" />
        <circle cx="41.4" cy="48.1" r="2" fill={eyes} opacity="0.92" />
        <circle cx="59.6" cy="48.1" r="2" fill={eyes} opacity="0.92" />
        <circle cx="41.4" cy="48.1" r="0.95" fill="#100c08" />
        <circle cx="59.6" cy="48.1" r="0.95" fill="#100c08" />
        <path d="M36 42 Q41 40 46 42" stroke={hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M54 42 Q59 40 64 42" stroke={hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* 鼻梁与嘴 */}
        <path d="M50 48 L48 58 L53 58" stroke={skinShade} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M45 65 Q50 68 55 65" stroke="#7d4a3e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* 胡须 */}
        {spec.beard && (
          <path d="M36 58 Q38 76 50 78 Q62 76 64 58 Q58 68 50 68 Q42 68 36 58 Z" fill={hair} opacity="0.9" />
        )}

        {/* 战纹 */}
        {spec.warpaint && (
          <>
            <rect x="34" y="44" width="14" height="2.6" fill="#2f4a63" opacity="0.75" transform="rotate(-8 41 45)" />
            <rect x="52" y="44" width="14" height="2.6" fill="#2f4a63" opacity="0.75" transform="rotate(8 59 45)" />
          </>
        )}

        {/* 内阴影 */}
        <rect width="100" height="100" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="6" />
      </g>
    </svg>
  )
}
