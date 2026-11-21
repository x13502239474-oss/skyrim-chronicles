import { AnimatePresence, motion } from 'framer-motion'
import { Crosshair, Minus, Plus, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { holds, holdById, placeEntries } from '@/data'
import { MAP_HEIGHT, MAP_WIDTH, landmass, solstheimShape } from '@/data/regions'
import type { RegionId } from '@/types'
import { usePlayer } from '@/store/PlayerContext'
import { cn } from './ui'

/* ---------------------------------------------------------------- */
/* 地点图标                                                          */
/* ---------------------------------------------------------------- */

const GLYPHS: Record<string, { d: string; hole?: string }> = {
  city: { d: 'M1 15 V7 h3 v2 h2 V7 h4 v2 h2 V7 h3 v8 Z' },
  town: { d: 'M2 15 V9 h3 v6 Z M7 15 V6 h3 v9 Z M12 15 V10 h2 v5 Z' },
  village: { d: 'M2 15 V10 L5.5 6.5 L9 10 V15 Z M10 15 V11 L12.5 8.5 L15 11 V15 Z' },
  farm: { d: 'M2 15 V9 h5 v6 Z M9 15 c0 -3.5 3 -4.5 5.5 -4.5 V15 Z' },
  castle: { d: 'M1 15 V6 h2 v2 h2 V6 h2 v2 h2 V6 h2 v2 h2 V6 h2 v9 Z' },
  fort: { d: 'M2 15 V8 h12 v7 Z M4 8 V4 h8 v4 Z' },
  stronghold: { d: 'M1 15 V5 h3 v2 h2 V5 h2 v2 h2 V5 h2 v2 h2 V5 h1 v10 Z' },
  cave: { d: 'M8 3 C4 3 2 7.5 2 13 v2 h12 v-2 C14 7.5 12 3 8 3 Z', hole: 'M8 8.5 a2.2 2.2 0 0 1 2.2 2.2 V15 H5.8 v-4.3 A2.2 2.2 0 0 1 8 8.5 Z' },
  'nordic-ruin': { d: 'M8 2 L14.5 14 H1.5 Z', hole: 'M8 6.5 L11 12.5 H5 Z' },
  'dwemer-ruin': { d: 'M8 1 L9.8 3.2 L12.6 2.6 L12.9 5.5 L15.4 6.8 L14 9.4 L15 12.1 L12.3 13.2 L11.4 15.4 L8 15 L4.6 15.4 L3.7 13.2 L1 12.1 L2 9.4 L0.6 6.8 L3.1 5.5 L3.4 2.6 L6.2 3.2 Z', hole: 'M8 5.4 A2.6 2.6 0 1 1 7.99 5.4 Z' },
  'dragon-shrine': { d: 'M8 1 L14.5 8 L8 15 L1.5 8 Z', hole: 'M8 5 L11 8 L8 11 L5 8 Z' },
  temple: { d: 'M1.5 6 L8 1.5 L14.5 6 V15 H1.5 Z', hole: 'M6.2 15 V9.4 h3.6 V15 Z' },
  mine: { d: 'M2 13.5 L11 4.5 L13.5 2 L15 3.5 L11.5 6.5 L3.5 15 Z M9 2 C11.5 1.6 15 3.2 15.4 6 L12.6 4.8 C11.4 3.6 10.2 2.8 9 2 Z' },
  shop: { d: 'M1.5 5.5 h13 l-1.2 3.2 H2.7 Z M3 9.2 h10 V15 H3 Z' },
  tavern: { d: 'M2.5 4.5 h7.2 V11 a3.2 3.2 0 0 1 -3.2 3.2 H5.7 A3.2 3.2 0 0 1 2.5 11 Z M9.7 6.6 h1.8 a2.2 2.2 0 0 1 0 4.4 H9.7 Z' },
  hall: { d: 'M1.5 15 V8 L8 2.5 L14.5 8 V15 Z', hole: 'M9.6 15 V10 h3.4 V15 Z' },
  landmark: { d: 'M8 1.4 L9.4 6.4 L14.4 8 L9.4 9.6 L8 14.6 L6.6 9.6 L1.6 8 L6.6 6.4 Z' },
  camp: { d: 'M8 2 L15 14.5 H1 Z', hole: 'M8 7 L11 14 H5 Z' },
  dock: { d: 'M7.2 1 h1.6 V15 H7.2 Z M1.5 7 h13 v1.6 h-13 Z M3.5 12 L8 15.4 L12.5 12 V13.8 L8 17 L3.5 13.8 Z' },
  grove: { d: 'M8 1 L11.6 6.6 H4.4 Z M8 4.4 L13.4 12 H2.6 Z M7 11.8 h2 V15.4 H7 Z' },
  lighthouse: { d: 'M5.6 15 L7 4.6 h2 L10.4 15 Z M5.4 4.6 h5.2 v1.4 H5.4 Z M7.6 1.4 h.8 v2.6 h-.8 Z' },
  college: { d: 'M5.6 15 V4.6 h4.8 V15 Z M8 0.8 L11.6 4.4 H4.4 Z M3 15 h10 v.8 H3 Z' },
  ruin: { d: 'M2.6 15 V6.4 h2.2 V15 Z M6.6 15 V3.2 h2.2 V15 Z M10.8 15 V8.6 h2.2 V15 Z' },
}

const glyphFor = (type: string) => GLYPHS[type] ?? GLYPHS.landmark

/* ---------------------------------------------------------------- */
/* 分类筛选                                                          */
/* ---------------------------------------------------------------- */

export const typeGroups: { id: string; label: string; types: string[] }[] = [
  { id: 'settlement', label: '城镇村落', types: ['city', 'town', 'village', 'farm'] },
  { id: 'fort', label: '堡垒要塞', types: ['fort', 'castle', 'stronghold', 'hall'] },
  { id: 'ruin', label: '遗迹祭坛', types: ['nordic-ruin', 'dwemer-ruin', 'ruin', 'dragon-shrine'] },
  { id: 'wild', label: '洞穴矿场', types: ['cave', 'mine', 'camp'] },
  { id: 'civic', label: '神庙商铺', types: ['temple', 'shop', 'tavern', 'college'] },
  { id: 'land', label: '自然地标', types: ['landmark', 'grove', 'dock', 'lighthouse'] },
]

export type ExploreFilter = 'all' | 'discovered' | 'undiscovered' | 'favorited'

/* ---------------------------------------------------------------- */
/* 地图                                                              */
/* ---------------------------------------------------------------- */

export function SkyrimMap({
  selectedId,
  onSelect,
  onHoldSelect,
  regionFilter,
  typeFilter,
  exploreFilter,
  query,
}: {
  selectedId?: string
  onSelect: (id: string) => void
  onHoldSelect?: (regionId: RegionId) => void
  regionFilter: RegionId | 'all'
  typeFilter: string
  exploreFilter: ExploreFilter
  query: string
}) {
  const { exploration } = usePlayer()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const panState = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const pinchState = useRef<{ dist: number; k: number } | null>(null)

  const toUser = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const loc = pt.matrixTransform(ctm.inverse())
    return { x: loc.x, y: loc.y }
  }, [])

  const clamp = (v: { x: number; y: number; k: number }) => {
    const marginX = MAP_WIDTH * 0.45
    const marginY = MAP_HEIGHT * 0.45
    return {
      k: v.k,
      x: Math.min(marginX, Math.max(-(MAP_WIDTH * v.k - MAP_WIDTH) - marginX, v.x)),
      y: Math.min(marginY, Math.max(-(MAP_HEIGHT * v.k - MAP_HEIGHT) - marginY, v.y)),
    }
  }

  const zoomAt = useCallback((factor: number, center?: { x: number; y: number }) => {
    setView((prev) => {
      const k = Math.min(5, Math.max(0.65, prev.k * factor))
      const c = center ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }
      const wx = (c.x - prev.x) / prev.k
      const wy = (c.y - prev.y) / prev.k
      return clamp({ k, x: c.x - wx * k, y: c.y - wy * k })
    })
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const c = toUser(e.clientX, e.clientY)
      zoomAt(e.deltaY > 0 ? 0.88 : 1.14, c)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [toUser, zoomAt])

  /* 选中项定位 */
  const place = useMemo(() => placeEntries.find((p) => p.id === selectedId), [selectedId])
  useEffect(() => {
    if (!place?.pos) return
    const [px, py] = place.pos
    setView((prev) => clamp({ k: Math.max(prev.k, 1.6), x: MAP_WIDTH / 2 - px * Math.max(prev.k, 1.6), y: MAP_HEIGHT / 2 - py * Math.max(prev.k, 1.6) }))
  }, [place?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      panState.current = { x: e.clientX, y: e.clientY, tx: view.x, ty: view.y }
      setDragging(true)
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchState.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }
      panState.current = null
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size >= 2 && pinchState.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const ratio = dist / (pinchState.current.dist || 1)
      const k = Math.min(5, Math.max(0.65, pinchState.current.k * ratio))
      setView((prev) => clamp({ k, x: prev.x, y: prev.y }))
      return
    }

    if (panState.current) {
      const p0 = toUser(panState.current.x, panState.current.y)
      const p1 = toUser(e.clientX, e.clientY)
      const dx = (p1.x - p0.x) / view.k
      const dy = (p1.y - p0.y) / view.k
      setView(clamp({ k: view.k, x: panState.current.tx + dx, y: panState.current.ty + dy }))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) {
      panState.current = null
      pinchState.current = null
      setDragging(false)
    } else if (pointers.current.size === 1) {
      pinchState.current = null
      const [a] = [...pointers.current.values()]
      panState.current = { x: a.x, y: a.y, tx: view.x, ty: view.y }
    }
  }

  /* ---------- 筛选 ---------- */
  const markers = useMemo(() => {
    const q = query.trim().toLowerCase()
    const types = typeFilter === 'all' ? null : typeGroups.find((g) => g.id === typeFilter)?.types ?? null
    return placeEntries.filter((p) => {
      if (!p.pos) return false
      if (regionFilter !== 'all' && p.regionId !== regionFilter) return false
      if (types && !types.includes(p.type)) return false
      if (q && !p.name.zh.toLowerCase().includes(q) && !p.name.en.toLowerCase().includes(q)) return false
      const rec = exploration[p.id]
      if (exploreFilter === 'discovered' && !rec?.discovered) return false
      if (exploreFilter === 'undiscovered' && rec?.discovered) return false
      if (exploreFilter === 'favorited' && !rec?.favorited) return false
      return true
    })
  }, [regionFilter, typeFilter, exploreFilter, query, exploration])

  const inv = 1 / view.k

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d1116]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className={cn('h-full w-full touch-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="application"
        aria-label="天际省世界地图"
      >
        <defs>
          <radialGradient id="sea" cx="50%" cy="48%" r="72%">
            <stop offset="0%" stopColor="#16222c" />
            <stop offset="100%" stopColor="#070b0f" />
          </radialGradient>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#57503a" />
            <stop offset="42%" stopColor="#413c2b" />
            <stop offset="100%" stopColor="#2b271d" />
          </linearGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#c9a227" strokeOpacity="0.05" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#sea)" />
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapGrid)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {/* 陆地 */}
          <path d={landmass} fill="none" stroke="#0a0d10" strokeOpacity="0.55" strokeWidth="10" strokeLinejoin="round" />
          <path d={solstheimShape} fill="none" stroke="#0a0d10" strokeOpacity="0.55" strokeWidth="8" strokeLinejoin="round" />
          <path d={landmass} fill="url(#landGrad)" stroke="#9d8a5c" strokeOpacity="0.45" strokeWidth="2.5" />
          <path d={solstheimShape} fill="url(#landGrad)" stroke="#9d8a5c" strokeOpacity="0.45" strokeWidth="2" />

          {/* 领地轮廓 */}
          {holds.map((h) => {
            const active = regionFilter === h.id
            const dim = regionFilter !== 'all' && !active
            return (
              <g key={h.id} opacity={dim ? 0.35 : 1}>
                <polygon
                  points={h.polygon.map((p) => p.join(',')).join(' ')}
                  fill={h.color}
                  fillOpacity={active ? 0.34 : 0.2}
                  stroke={h.color}
                  strokeOpacity={active ? 0.95 : 0.6}
                  strokeWidth={active ? 2 : 1}
                  className="cursor-pointer transition-all"
                  onClick={() => onHoldSelect?.(h.id)}
                />
                <text
                  x={h.labelPos[0]}
                  y={h.labelPos[1]}
                  textAnchor="middle"
                  fontSize={17 * inv}
                  letterSpacing={2 * inv}
                  fill="#e6d6b0"
                  fillOpacity={0.62}
                  style={{ fontFamily: 'Cinzel, Noto Serif SC, serif', pointerEvents: 'none' }}
                >
                  {h.name.zh}
                </text>
              </g>
            )
          })}

          {/* 索瑟姆标注 */}
          <text
            x={933}
            y={92}
            textAnchor="middle"
            fontSize={13 * inv}
            fill="#e6d6b0"
            fillOpacity={0.55}
            style={{ fontFamily: 'Cinzel, Noto Serif SC, serif', pointerEvents: 'none' }}
          >
            索瑟姆
          </text>

          {/* 地点标记 */}
          {markers.map((p) => {
            const rec = exploration[p.id]
            const discovered = Boolean(rec?.discovered)
            const selected = p.id === selectedId
            const hovered = p.id === hoverId
            const [x, y] = p.pos!
            const g = glyphFor(p.type)
            const scale = inv * (p.kind === 'city' ? 1.7 : 1.4)
            return (
              <g
                key={p.id}
                transform={`translate(${x} ${y}) scale(${scale})`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(p.id)
                }}
                onPointerEnter={() => setHoverId(p.id)}
                onPointerLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                className="cursor-pointer"
              >
                {(selected || hovered) && (
                  <circle r="13" fill="none" stroke="#c9a227" strokeOpacity={selected ? 0.9 : 0.45} strokeWidth="1.2" />
                )}
                {p.kind === 'city' && (
                  <circle r="10" fill="#120e09" fillOpacity="0.62" stroke="#e0c483" strokeOpacity={discovered ? 0.7 : 0.3} strokeWidth="1.2" />
                )}
                <g transform="translate(-8 -8)">
                  <path
                    d={g.d}
                    fillRule="evenodd"
                    fill={discovered ? '#e0c483' : '#7d7360'}
                    fillOpacity={discovered ? 0.98 : 0.55}
                    stroke={discovered ? '#3a2c14' : '#1c1a14'}
                    strokeWidth="0.6"
                  />
                  {g.hole && <path d={g.hole} fill="#12100b" fillOpacity="0.85" />}
                </g>
                {rec?.favorited && (
                  <path
                    d="M0 -13 l2.4 4.8 5.3 .8 -3.8 3.7 .9 5.3 -4.8 -2.5 -4.8 2.5 .9 -5.3 -3.8 -3.7 5.3 -.8 Z"
                    fill="#c9a227"
                    stroke="#2a1f0c"
                    strokeWidth="0.6"
                  />
                )}
                {selected && (
                  <circle r="16" fill="none" stroke="#e0c483" strokeWidth="1" strokeOpacity="0.5" filter="url(#softGlow)" />
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* 控件 */}
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 flex-col gap-1.5">
        <button
          type="button"
          onClick={() => zoomAt(1.3)}
          aria-label="放大"
          className="panel-soft flex h-9 w-9 items-center justify-center text-parchment/70 hover:text-parchment"
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(0.77)}
          aria-label="缩小"
          className="panel-soft flex h-9 w-9 items-center justify-center text-parchment/70 hover:text-parchment"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          onClick={() => setView({ x: 0, y: 0, k: 1 })}
          aria-label="重置视图"
          className="panel-soft flex h-9 w-9 items-center justify-center text-parchment/70 hover:text-parchment"
        >
          <Crosshair size={15} />
        </button>
      </div>

      {/* 指北针 */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-end gap-1.5 text-parchment/25">
        <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden>
          <path d="M13 2 L19 18 L13 15 L7 18 Z" fill="#c9a227" fillOpacity="0.55" />
          <path d="M13 15 L19 18 L13 32 L7 18 Z" fill="#8a5a2b" fillOpacity="0.5" />
        </svg>
        <span className="font-display text-[9px] tracking-[0.3em]">N</span>
      </div>

      {/* 图例 */}
      <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-3 text-[10px] text-parchment/40 sm:flex">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-[#e0c483]" /> 已探索
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 bg-[#7d7360]" /> 未探索
        </span>
        <span className="flex items-center gap-1">
          <Star size={9} className="text-gold" /> 收藏
        </span>
      </div>

      <AnimatePresence>
        {hoverId && !selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 border border-gold/25 bg-coal/92 px-2.5 py-1 text-[11px] text-parchment/80 sm:hidden"
          >
            {placeEntries.find((p) => p.id === hoverId)?.name.zh}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** 领地筛选数据 */
export const regionOptions: { id: RegionId | 'all'; label: string }[] = [
  { id: 'all', label: '全境' },
  ...holds.map((h) => ({ id: h.id as RegionId, label: h.name.zh })),
  { id: 'solstheim', label: '索瑟姆' },
]

export const regionColor = (id: RegionId) => (id === 'solstheim' ? '#6d7a86' : holdById[id as keyof typeof holdById]?.color ?? '#8a7a58')
