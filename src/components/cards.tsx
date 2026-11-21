import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { Character, City, Faction, Hold, Item, Quest, WorldLocation } from '@/types'
import { cityById, dangerLabel, questCategoryName, regionLabel } from '@/data'
import { Portrait, portraitFor } from './Portrait'
import { SceneStrip } from './Scene'
import { Badge, cn } from './ui'
import { itemCategoryTone, questStatusLabels, questStatusTone } from '@/lib/labels'
import type { QuestStatus } from '@/types'

/* ---------------------------------------------------------------- */
/* 纹章                                                              */
/* ---------------------------------------------------------------- */

const sigilArt: Record<string, ReactNode> = {
  horse: (
    <path d="M9.6 21h6.8v-1.6H9.6zM11 17.8h4.4v-1.5H11zM12.6 15.4c-1.9-.5-3.2-2.2-3.2-4.2 0-1.2.5-2.3 1.4-3.1l2.3-2V4.4c0-.5.4-.9.9-.9.4 0 .8.3.9.7l.4 1.3 2.5 2.2c1 .9 1.6 2.2 1.6 3.6 0 1.8-1 3.4-2.6 4.1v2h-4.2zM8.2 12.4l-1.6 1.1.9 1.3 1.5-1z" />
  ),
  wolf: (
    <path d="M3.4 3.6l3.6 3.9h10l3.6-3.9v6.2l-2.5 3.6-2 8.6-3.1-4.6-3 4.6-2-8.6-2.6-3.6zM9.1 9.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm5.8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  ),
  bear: (
    <g>
      <circle cx="6" cy="6.2" r="2.6" />
      <circle cx="18" cy="6.2" r="2.6" />
      <ellipse cx="12" cy="12.8" rx="7.4" ry="6.6" />
      <ellipse cx="12" cy="15.4" rx="3" ry="2.4" fill="#1a1208" opacity="0.55" />
    </g>
  ),
  leaf: (
    <g>
      <path d="M12 1.6C6.2 7.4 4.6 14.2 12 22.4c7.4-8.2 5.8-15 0-20.8z" />
      <path d="M12 4.6v15.2" stroke="#1a1208" strokeWidth="1.2" strokeOpacity="0.5" fill="none" />
    </g>
  ),
  knot: (
    <g stroke="currentColor" strokeWidth="1.9" fill="none">
      <circle cx="12" cy="12" r="6.6" />
      <path d="M5.4 12c0-4 3-6.6 6.6-6.6M18.6 12c0 4-3 6.6-6.6 6.6" />
      <path d="M8.4 8.4l7.2 7.2M15.6 8.4l-7.2 7.2" strokeWidth="1.2" strokeOpacity="0.55" />
    </g>
  ),
  antler: (
    <g stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round">
      <path d="M8 22V11M8 11L4.6 7.2M8 14.4L5 12M16 22V11M16 11l3.4-3.8M16 14.4l3-2.4" />
      <path d="M8 11c0-4 1.6-6.4 4-8 2.4 1.6 4 4 4 8" />
    </g>
  ),
  star: (
    <path d="M12 1.2l2 6.2 6.4-.6-4.8 4.3 3 5.7-6.6-1.6-6.6 1.6 3-5.7L3.6 6.8 10 7.4z" />
  ),
  snowflake: (
    <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d="M12 2.2v19.6M3.6 7l16.8 10M20.4 7L3.6 17" />
      <path d="M12 6.4l-2.6-2M12 6.4l2.6-2M12 17.6l-2.6 2M12 17.6l2.6 2" strokeWidth="1.3" />
    </g>
  ),
  moon: <path d="M14.6 2.2a10 10 0 1 0 0 19.6A11 11 0 0 1 14.6 2.2z" />,
  eagle: (
    <path d="M12 4.4c1 0 1.8.7 1.8 1.7 0 .6-.3 1.1-.7 1.5 2.4.5 4.4 1.4 6.6 3.2-1.8.3-3.4.9-4.8 1.9 1 .2 2 .6 2.8 1.3-2 .4-3.7 1.3-5 2.6-.6.6-1.4.6-2 0-1.3-1.3-3-2.2-5-2.6.8-.7 1.8-1.1 2.8-1.3-1.4-1-3-1.6-4.8-1.9 2.2-1.8 4.2-2.7 6.6-3.2-.4-.4-.7-.9-.7-1.5 0-1 .8-1.7 1.8-1.7zM11.3 13.6h1.4l-.7 6z" />
  ),
  sun: (
    <g>
      <circle cx="12" cy="12" r="4.4" />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 1.6v3M12 19.4v3M1.6 12h3M19.4 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M19.4 4.6l-2.1 2.1M6.7 17.3l-2.1 2.1" />
      </g>
    </g>
  ),
  key: (
    <g>
      <circle cx="8.4" cy="8.4" r="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M11.8 11.8L20 20M17 17l2-2M14 14l2-2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </g>
  ),
  skull: (
    <g>
      <path d="M12 2.4c-4.6 0-7.6 3.2-7.6 7.4 0 2.4 1 4 2.4 5v3.2c0 .8.6 1.4 1.4 1.4h7.6c.8 0 1.4-.6 1.4-1.4v-3.2c1.4-1 2.4-2.6 2.4-5 0-4.2-3-7.4-7.6-7.4z" />
      <circle cx="9" cy="9.6" r="1.8" fill="#1a1208" opacity="0.7" />
      <circle cx="15" cy="9.6" r="1.8" fill="#1a1208" opacity="0.7" />
    </g>
  ),
  eye: (
    <g>
      <path d="M12 5.2c5.2 0 9 4 10 6.8-1 2.8-4.8 6.8-10 6.8S3 14.8 2 12c1-2.8 4.8-6.8 10-6.8z" />
      <circle cx="12" cy="12" r="3.4" fill="#1a1208" opacity="0.62" />
    </g>
  ),
  bat: (
    <path d="M12 6.6c1.2 0 2 .8 2 1.9 0 .9-.4 1.5-1 1.9 1.6 2 2.6 4.2 2.8 6.6-1.8-1-3.4-1.6-4.8-2.4-.8 1-1.4 2-2 3.4l-2-3.4c-1.4.8-3 1.4-4.8 2.4.2-2.4 1.2-4.6 2.8-6.6-.6-.4-1-1-1-1.9 0-1.1.8-1.9 2-1.9.9 0 1.6.5 2.2 1.4h1.6c.6-.9 1.3-1.4 2.2-1.4z" />
  ),
  dragon: (
    <path d="M12 3.2l2.4 3.6 4.8-1.2-2 4.4 4.4 2.6-4.6 1.6 1.6 4.6-4.6-1.8-2 4.2-2-4.2-4.6 1.8 1.6-4.6L2.4 12.6 6.8 10l-2-4.4 4.8 1.2z" />
  ),
  wind: (
    <g stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round">
      <path d="M2.6 8.4h12a2.4 2.4 0 1 0-2.4-2.4" />
      <path d="M2.6 13h16a2.4 2.4 0 1 1-2.4 2.4" />
      <path d="M2.6 17.6h8" />
    </g>
  ),
  ash: (
    <g>
      <path d="M12 2.4L22 20.6H2z" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 9.6l4 7.2H8z" opacity="0.6" />
    </g>
  ),
  tree: (
    <path d="M12 1.4l4.6 6.6H7.4zM12 5.6l5.6 7.4H6.4zM12 10.4l6.4 8H5.6zM10.8 18h2.4v4h-2.4z" />
  ),
  mushroom: (
    <g>
      <path d="M12 2.2c5 0 9 3.8 9 7.2 0 1.4-1.2 2.2-2.8 2.2H5.8c-1.6 0-2.8-.8-2.8-2.2 0-3.4 4-7.2 9-7.2z" />
      <path d="M9.8 12.6h4.4v6.2c0 1.6 1.4 2.4 2.6 2.4H7.2c1.2 0 2.6-.8 2.6-2.4z" opacity="0.75" />
    </g>
  ),
  coin: (
    <g>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="9" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </g>
  ),
}

export function Sigil({
  name,
  size = 26,
  className,
  color = 'currentColor',
}: {
  name: string
  size?: number
  className?: string
  color?: string
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill={color} aria-hidden style={{ display: 'block' }}>
      {sigilArt[name] ?? sigilArt.star}
    </svg>
  )
}

export function ShieldSigil({
  sigil,
  colors,
  size = 40,
}: {
  sigil: string
  colors: [string, string]
  size?: number
}) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 46" width={size} height={size * 1.15} aria-hidden className="absolute inset-0">
        <path d="M20 1.6L37 7v16.4C37 34 29.6 41.6 20 44.6 10.4 41.6 3 34 3 23.4V7z" fill={colors[0]} stroke={colors[1]} strokeWidth="1.6" />
        <path d="M20 5.2L33.4 9.6v13.8c0 8.6-6 15-13.4 17.6z" fill="#000" fillOpacity="0.16" />
      </svg>
      <span style={{ color: colors[1] }} className="relative">
        <Sigil name={sigil} size={size * 0.46} />
      </span>
    </span>
  )
}

/* ---------------------------------------------------------------- */
/* 收藏品图标                                                        */
/* ---------------------------------------------------------------- */

const itemGlyphs: Record<string, ReactNode> = {
  sword: <path d="M13.6 2h8.4v8.4L11 21.4l-4.2-4.2L18 6zM4 15.6l4.4 4.4-2.2 2.2L1.8 17.8z" />,
  dagger: <path d="M15.4 2L22 8.6 10.4 20.2 3.8 13.6zM3 17.6l3.4 3.4-3 3L0 20.6z" />,
  axe: <path d="M13.4 3.2c4.4-.6 8.4 2.6 9.4 6.8l-6.6 1.4c-.4-3-1.6-5.8-2.8-8.2zM12.2 7.6l3.4 3.4L3.4 23.2 0 19.8z" />,
  mace: (
    <g>
      <circle cx="15" cy="9" r="5.4" />
      <path d="M11 13L2.4 21.6 1 20.2 9.6 11.6z" />
    </g>
  ),
  staff: (
    <g>
      <circle cx="16.6" cy="6.4" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M13.4 9.6L2 21 1 20 12.4 8.6z" />
    </g>
  ),
  bow: (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M5 3c9 3 12 9 9 18" />
      <path d="M5 3l9 18" strokeWidth="1.2" />
      <path d="M3 12h8" strokeWidth="1.6" />
    </g>
  ),
  armor: <path d="M12 1.6l9 3.4v7.2c0 5.4-3.8 9.4-9 11.2-5.2-1.8-9-5.8-9-11.2V5z" />,
  shield: <path d="M12 1.6l9 3.4v7.2c0 5.4-3.8 9.4-9 11.2-5.2-1.8-9-5.8-9-11.2V5z" />,
  mask: (
    <g>
      <path d="M3.4 5.4h17.2v6c0 4.8-3.8 9-8.6 10.6C7.2 20.4 3.4 16.2 3.4 11.4z" />
      <circle cx="8.4" cy="10.6" r="1.9" fill="#1a1208" opacity="0.65" />
      <circle cx="15.6" cy="10.6" r="1.9" fill="#1a1208" opacity="0.65" />
      <path d="M9.6 16.6h4.8" stroke="#1a1208" strokeWidth="1.4" strokeOpacity="0.55" />
    </g>
  ),
  book: (
    <g>
      <path d="M3 4.4h7.2c1 0 1.8.8 1.8 1.8v14.6c0-1-.8-1.8-1.8-1.8H3z" />
      <path d="M21 4.4h-7.2c-1 0-1.8.8-1.8 1.8v14.6c0-1 .8-1.8 1.8-1.8H21z" opacity="0.75" />
    </g>
  ),
  scroll: <path d="M5 3h14v4h-3v11h3v3H5v-4h3V6H5zM7 7h3v9H7z" />,
  star: <path d="M12 1.6l2.8 6.6 7.2.6-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L1.999 8.8l7.2-.6z" />,
  'sun-sword': (
    <g>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M12 1v2.4M12 14.6V17M4 9h2.4M17.6 9H20M6.4 3.4l1.7 1.7M15.9 12.9l1.7 1.7M17.6 3.4l-1.7 1.7M8.1 12.9l-1.7 1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.8 15.4h2.4V23h-2.4z" />
    </g>
  ),
  skull: (
    <g>
      <path d="M12 2.4c-4.6 0-7.6 3.2-7.6 7.4 0 2.4 1 4 2.4 5v3.2c0 .8.6 1.4 1.4 1.4h7.6c.8 0 1.4-.6 1.4-1.4v-3.2c1.4-1 2.4-2.6 2.4-5 0-4.2-3-7.4-7.6-7.4z" />
      <circle cx="9" cy="9.6" r="1.7" fill="#1a1208" opacity="0.7" />
      <circle cx="15" cy="9.6" r="1.7" fill="#1a1208" opacity="0.7" />
    </g>
  ),
  stone: <path d="M6 9l6-6 6 6-3 12H9z" />,
  shard: <path d="M12 1.6l7 9.4-7 11.4-7-11.4z" />,
  phial: (
    <g>
      <path d="M9.6 2h4.8v3.4l3 5.2c1.4 2.4.2 11.4-5.4 11.4S6.2 13 7.6 10.6l2-5.2z" />
      <path d="M8 13.6h8" stroke="#1a1208" strokeWidth="1.4" strokeOpacity="0.4" />
    </g>
  ),
  leaf: <path d="M12 1.6C6.2 7.4 4.6 14.2 12 22.4c7.4-8.2 5.8-15 0-20.8z" />,
  key: (
    <g>
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M11.6 11.6L21 21M18 18l2.4-2.4M14.6 14.6l2.4-2.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </g>
  ),
  ingot: <path d="M7 6h10l4 12H3z" />,
  amulet: (
    <g>
      <path d="M5 3c0 6 2.4 9 7 9s7-3 7-9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15.4" r="5" />
      <circle cx="12" cy="15.4" r="2" fill="#1a1208" opacity="0.5" />
    </g>
  ),
  stand: <path d="M9 2h6v3H9zM10.6 5h2.8v11h-2.8zM6 16h12v3H6zM4 21h16v2H4z" />,
  gem: <path d="M8 2h8l5 6-9 14L3 8z" />,
}

export function ItemGlyph({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden style={{ display: 'block' }}>
      {itemGlyphs[name] ?? itemGlyphs.gem}
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* 卡片                                                              */
/* ---------------------------------------------------------------- */

export function CharacterCard({ c, compact = false }: { c: Character; compact?: boolean }) {
  return (
    <Link
      to={`/characters?focus=${c.id}`}
      className="panel group flex items-start gap-3 p-3 transition-colors hover:border-gold/45"
    >
      <Portrait spec={portraitFor(c)} race={c.race} size={compact ? 44 : 52} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[13.5px] text-parchment/92 group-hover:text-gold-soft">{c.name.zh}</span>
          <span className="shrink-0 text-[10px] text-parchment/25">{c.name.en}</span>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-parchment/50">{c.role}</span>
        {!compact && (
          <span className="mt-1.5 flex flex-wrap items-center gap-1">
            <Badge tone="muted">{regionLabel(c.regionId)}</Badge>
            {c.factionIds.slice(0, 2).map((f) => (
              <Badge key={f} tone="gold">
                {f}
              </Badge>
            ))}
          </span>
        )}
      </span>
    </Link>
  )
}

export function QuestCard({ q, status }: { q: Quest; status?: QuestStatus }) {
  return (
    <Link to={`/quests?focus=${q.id}`} className="panel group block p-3.5 transition-colors hover:border-gold/45">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] text-parchment/92 group-hover:text-gold-soft">{q.name.zh}</p>
          <p className="mt-0.5 text-[10px] tracking-[0.12em] text-parchment/30">{q.name.en}</p>
        </div>
        {status && <Badge tone={questStatusTone[status]}>{questStatusLabels[status]}</Badge>}
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-parchment/48">{q.summary}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <Badge tone="gold">{questCategoryName(q.category)}</Badge>
        {q.regionId && <Badge tone="muted">{regionLabel(q.regionId)}</Badge>}
      </div>
    </Link>
  )
}

export function PlaceCard({ l }: { l: WorldLocation }) {
  return (
    <Link to={`/location/${l.id}`} className="panel group block p-3.5 transition-colors hover:border-gold/45">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] text-parchment/92 group-hover:text-gold-soft">{l.name.zh}</p>
          <p className="mt-0.5 text-[10px] tracking-[0.1em] text-parchment/30">{l.name.en}</p>
        </div>
        <span className="shrink-0 text-[10px] text-parchment/35">{dangerLabel(l.danger)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-parchment/48">{l.summary}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge tone="muted">{regionLabel(l.regionId)}</Badge>
        {l.questIds.length > 0 && <Badge tone="gold">{l.questIds.length} 项任务</Badge>}
      </div>
    </Link>
  )
}

export function CityCard({ city }: { city: City }) {
  const hold = city.regionId !== 'solstheim' ? city.regionId : undefined
  return (
    <Link to={`/city/${city.id}`} className="panel group block overflow-hidden transition-colors hover:border-gold/45">
      <SceneStrip palette={city.palette} seed={city.name.en.length} className="h-24" />
      <div className="p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[14px] text-parchment/92 group-hover:text-gold-soft">{city.name.zh}</p>
          <span className="shrink-0 text-[10px] tracking-[0.12em] text-parchment/30">{city.name.en}</span>
        </div>
        <p className="mt-1 text-[11px] text-parchment/45">
          {hold ? regionLabel(hold) : '索瑟姆'} · {city.type === 'city' ? '城市' : '城镇'}
        </p>
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-parchment/48">{city.summary}</p>
        <p className="mt-2 text-[10.5px] text-parchment/35">统治者：{city.rulerName}</p>
      </div>
    </Link>
  )
}

export function FactionCard({ f }: { f: Faction }) {
  return (
    <Link to={`/factions?focus=${f.id}`} className="panel group block p-3.5 transition-colors hover:border-gold/45">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center border"
          style={{ borderColor: `${f.colors[1]}55`, background: `${f.colors[0]}55`, color: f.colors[1] }}
        >
          <Sigil name={f.glyph} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] text-parchment/92 group-hover:text-gold-soft">{f.name.zh}</p>
          <p className="mt-0.5 text-[10.5px] text-parchment/40">{f.type}</p>
        </div>
      </div>
      <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-parchment/48">{f.summary}</p>
      <div className="mt-2.5 flex items-center gap-1.5">
        <Badge tone="muted">{f.memberIds.length} 位成员</Badge>
        {f.joinable && <Badge tone="gold">可加入</Badge>}
      </div>
    </Link>
  )
}

export function ItemCard({
  item,
  owned,
  favorite,
  onToggleOwned,
  onToggleFavorite,
  onOpen,
  custom,
}: {
  item: Item
  owned: boolean
  favorite: boolean
  onToggleOwned: () => void
  onToggleFavorite: () => void
  onOpen?: () => void
  custom?: boolean
}) {
  const tone = itemCategoryTone[item.category]
  return (
    <div className={cn('panel flex flex-col p-3.5 transition-colors', owned ? 'border-gold/40' : 'border-gold/12')}>
      <div className="flex items-start gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center border"
          style={{ borderColor: `${tone}66`, background: `${tone}22`, color: tone }}
        >
          <ItemGlyph name={item.glyph} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="block w-full truncate text-left text-[13px] text-parchment/92 hover:text-gold-soft">
            {item.name.zh}
          </button>
          <p className="truncate text-[10px] tracking-[0.08em] text-parchment/30">{item.name.en}</p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={favorite ? '取消收藏' : '收藏'}
          className={cn('shrink-0 p-1 transition-colors', favorite ? 'text-gold' : 'text-parchment/25 hover:text-gold/60')}
        >
          <Star size={14} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge tone="muted">{item.subtype}</Badge>
        {custom && <Badge tone="frost">自定义</Badge>}
      </div>
      <p className="mt-2 line-clamp-2 flex-1 text-[11.5px] leading-relaxed text-parchment/45">{item.effect}</p>
      <button
        type="button"
        onClick={onToggleOwned}
        className={cn('btn btn-sm mt-2.5 w-full', owned ? 'btn-primary' : 'btn-ghost')}
      >
        {owned ? '已获得' : '标记获得'}
      </button>
    </div>
  )
}

export function RegionCard({ hold }: { hold: Hold }) {
  return (
    <Link to={`/region/${hold.id}`} className="panel group relative block overflow-hidden p-4 transition-colors hover:border-gold/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] text-parchment/30 uppercase">{hold.name.en}</p>
          <p className="mt-1 text-[16px] text-parchment group-hover:text-gold-soft">{hold.name.zh}</p>
          <p className="mt-1 text-[11px] text-parchment/45">首府 · {cityById[hold.capitalId]?.name.zh ?? hold.jarlName}</p>
        </div>
        <ShieldSigil sigil={hold.sigil} colors={hold.banner} size={38} />
      </div>
      <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-parchment/50">{hold.tagline}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <Badge tone={hold.allegiance === 'imperial' ? 'blood' : hold.allegiance === 'stormcloak' ? 'frost' : 'muted'}>
          {hold.allegiance === 'imperial' ? '帝国控制' : hold.allegiance === 'stormcloak' ? '风暴斗篷' : '中立'}
        </Badge>
        <span className="text-[10px] text-parchment/30">{hold.locationIds.length} 处地点</span>
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-[2px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${hold.color}, transparent)` }}
      />
    </Link>
  )
}
