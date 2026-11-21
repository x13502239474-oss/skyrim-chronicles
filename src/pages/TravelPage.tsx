import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Compass,
  Footprints,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge, Chip, EmptyState, Hairline, Panel, SectionHeading, cn } from '@/components/ui'
import {
  cityById,
  placeById,
  placeEntries,
  regionLabel,
} from '@/data'
import { scenePalettes } from '@/data/regions'
import { formatWorldTime, usePlayer, worldPhase } from '@/store/PlayerContext'
import type { PlaceEntry } from '@/data'

type Mode = 'walk' | 'horse' | 'fast'

const modeInfo: Record<Mode, { label: string; icon: typeof Footprints; speed: number; note: string }> = {
  walk: { label: '徒步', icon: Footprints, speed: 1, note: '沿道路步行，途中可能遭遇野兽与强盗。' },
  horse: { label: '骑马', icon: Navigation, speed: 2.2, note: '骑乘坐骑赶路，速度更快。' },
  fast: { label: '快速旅行', icon: Compass, speed: 6, note: '经由已知路线直达，跳过沿途遭遇。仅可前往已发现的地点。' },
}

const dist = (a?: [number, number], b?: [number, number]) => {
  if (!a || !b) return 0
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** 在两个地点之间，挑出地图上位于连线附近的中途地标 */
function routeThrough(from: PlaceEntry, to: PlaceEntry): PlaceEntry[] {
  if (!from.pos || !to.pos) return []
  const [x1, y1] = from.pos
  const [x2, y2] = to.pos
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy || 1
  return placeEntries
    .filter((p) => p.id !== from.id && p.id !== to.id && p.pos)
    .map((p) => {
      const t = Math.max(0, Math.min(1, (((p.pos![0] - x1) * dx + (p.pos![1] - y1) * dy) / len2)))
      const cx = x1 + t * dx
      const cy = y1 + t * dy
      return { p, t, d: Math.hypot(p.pos![0] - cx, p.pos![1] - cy) }
    })
    .filter((x) => x.d < 55 && x.t > 0.05 && x.t < 0.95)
    .sort((a, b) => a.t - b.t)
    .slice(0, 3)
    .map((x) => x.p)
}

export default function TravelPage() {
  const { profile, world, exploration, updateProfile, discover, advanceHours, logEvent, addJournal, notify } = usePlayer()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('walk')
  const [destination, setDestination] = useState<PlaceEntry | null>(null)
  const [writeJournal, setWriteJournal] = useState(true)

  const origin = profile ? placeById[profile.locationId] : undefined
  const originName = origin?.name.zh ?? cityById[profile?.locationId ?? '']?.name.zh ?? '河木镇'

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return placeEntries
      .filter((p) => p.id !== profile?.locationId)
      .filter((p) => {
        if (!q) return p.kind === 'city' || p.danger <= 2
        return p.name.zh.toLowerCase().includes(q) || p.name.en.toLowerCase().includes(q) || regionLabel(p.regionId).includes(q)
      })
      .sort((a, b) => {
        const da = exploration[a.id]?.discovered ? 0 : 1
        const db = exploration[b.id]?.discovered ? 0 : 1
        if (mode === 'fast' && da !== db) return da - db
        return (a.kind === 'city' ? 0 : 1) - (b.kind === 'city' ? 0 : 1)
      })
      .slice(0, q ? 24 : 14)
  }, [query, exploration, mode, profile?.locationId])

  const waypoints = destination && origin ? routeThrough(origin, destination) : []
  const rawDistance = origin && destination ? dist(origin.pos, destination.pos) : 0
  const travelHours = Math.max(1, Math.round((rawDistance / 26) / modeInfo[mode].speed))
  const canFast = mode !== 'fast' || (destination ? Boolean(exploration[destination.id]?.discovered) : true)

  const doTravel = () => {
    if (!destination) {
      notify('请先选择目的地。')
      return
    }
    if (!canFast) {
      notify('快速旅行需要先行发现目的地。')
      return
    }
    const from = originName
    advanceHours(travelHours)
    updateProfile({ locationId: destination.id })
    discover(destination.id)
    waypoints.forEach((p) => discover(p.id))
    const timeNote = `${formatWorldTime(world)} · ${worldPhase(world.hour)}`
    logEvent(`从${from}${mode === 'fast' ? '快速旅行' : '出发'}抵达${destination.name.zh}，耗时约 ${travelHours} 小时。`)
    if (writeJournal) {
      addJournal({
        title: `旅途：${from} → ${destination.name.zh}`,
        body: [
          `第 ${world.day} 日，${worldPhase(world.hour)}。我从${from}启程，${mode === 'fast' ? '沿着熟悉的路线快速穿行' : `以${modeInfo[mode].label}的方式`}前往${destination.name.zh}。`,
          waypoints.length ? `途经：${waypoints.map((p) => p.name.zh).join('、')}。` : '',
          `这一路走了大约 ${travelHours} 个小时。${destination.summary}`,
          '',
          '（这是根据你的旅行自动生成的草稿，可随时编辑。）',
        ].filter(Boolean).join('\n'),
        inWorldDate: timeNote,
        locationId: destination.id,
        characterIds: [],
        questIds: [],
        tags: ['旅行', regionLabel(destination.regionId)],
        images: [],
      })
    }
    notify(`你已抵达${destination.name.zh}。`)
    setDestination(null)
    setQuery('')
  }

  const palette = destination ? scenePalettes[destination.regionId] : scenePalettes.whiterun

  return (
    <div>
      <PageHeader
        eyebrow="WORLD INTERACTION · 世界互动"
        title="旅行与路线"
        en="TRAVEL & ROUTES"
        sub="选择起点与终点，规划路线、估算耗时，并把这段旅程写进你的编年史。旅行会推进世界时间，并让你发现沿途的地点。"
        palette={palette}
        crumbs={[{ to: '/', label: '营地' }, { label: '旅行' }]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------------- 路线规划 ---------------- */}
        <div className="space-y-6">
          <Panel className="p-4 sm:p-5">
            <SectionHeading title="选择目的地" eyebrow="DESTINATION" />

            {origin && (
              <div className="mt-3 flex items-center gap-3 border border-gold/20 bg-leather/30 px-3 py-2.5">
                <MapPin size={14} className="shrink-0 text-gold/70" />
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-[8px] text-parchment/40">当前所在</p>
                  <p className="truncate text-[13px] text-parchment/90">{originName}</p>
                </div>
                <span className="text-[10px] text-parchment/40">{regionLabel(origin.regionId)}</span>
              </div>
            )}

            <div className="relative mt-3">
              <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-parchment/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索城市或地点…"
                className="input w-full pl-9"
              />
            </div>

            <div className="no-bar mt-3 max-h-[300px] space-y-1 overflow-y-auto pr-1">
              {results.length === 0 && <EmptyState title="没有匹配的地点" hint="换个名字或领地试试。" />}
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDestination(p)}
                  className={cn(
                    'flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors',
                    destination?.id === p.id
                      ? 'border-gold/60 bg-gold/10'
                      : 'border-transparent hover:border-gold/25 hover:bg-leather/25',
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-gold/20 text-gold/70">
                    {p.kind === 'city' ? <Compass size={13} /> : <MapPin size={13} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] text-parchment/90">{p.name.zh}</span>
                      {exploration[p.id]?.discovered && <Badge tone="moss">已发现</Badge>}
                    </span>
                    <span className="block truncate text-[10px] text-parchment/40">
                      {regionLabel(p.regionId)} · {p.typeLabel}
                    </span>
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-parchment/25" />
                </button>
              ))}
            </div>
          </Panel>

          {destination && (
            <Panel className="corner-frame p-4 sm:p-5">
              <SectionHeading title="路线预览" eyebrow="ROUTE" />

              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 text-[12px]">
                <span className="border border-gold/25 px-2 py-1 text-parchment/85">{originName}</span>
                {waypoints.map((p) => (
                  <span key={p.id} className="flex items-center gap-2">
                    <ArrowRight size={11} className="text-parchment/30" />
                    <span className="border border-parchment/15 px-2 py-1 text-parchment/55">{p.name.zh}</span>
                  </span>
                ))}
                <span className="flex items-center gap-2">
                  <ArrowRight size={11} className="text-parchment/30" />
                  <span className="border border-gold/50 bg-gold/10 px-2 py-1 text-gold-soft">{destination.name.zh}</span>
                </span>
              </div>

              <Hairline />

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="eyebrow text-[8px] text-parchment/40">目的地</p>
                  <p className="mt-1 text-[13px] text-parchment/90">{destination.name.zh}</p>
                  <p className="text-[10px] text-parchment/40">{regionLabel(destination.regionId)}</p>
                </div>
                <div>
                  <p className="eyebrow text-[8px] text-parchment/40">途经地标</p>
                  <p className="mt-1 text-[13px] text-parchment/90">{waypoints.length ? waypoints.length + ' 处' : '直达'}</p>
                  <p className="text-[10px] text-parchment/40">沿线可发现</p>
                </div>
                <div>
                  <p className="eyebrow text-[8px] text-parchment/40">预计耗时</p>
                  <p className="mt-1 font-display text-[15px] text-gold-soft">{travelHours} 小时</p>
                  <p className="text-[10px] text-parchment/40">抵达 {world.day} 日 · {(world.hour + travelHours) % 24}:00</p>
                </div>
              </div>

              <Hairline />

              <div>
                <p className="label">旅行方式</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(modeInfo) as Mode[]).map((m) => {
                    const Icon = modeInfo[m].icon
                    return (
                      <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                        <Icon size={12} className="mr-1" /> {modeInfo[m].label}
                      </Chip>
                    )
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-parchment/45">{modeInfo[mode].note}</p>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 border border-gold/15 bg-coal/25 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={writeJournal}
                  onChange={(e) => setWriteJournal(e.target.checked)}
                  className="h-4 w-4 accent-[#c9a227]"
                />
                <BookOpen size={13} className="text-gold/70" />
                <span className="text-[11.5px] text-parchment/75">旅途中自动生成一篇日记草稿</span>
              </label>

              {!canFast && (
                <p className="mt-3 border border-blood/30 bg-blood/10 px-3 py-2 text-[11px] text-parchment/70">
                  你还没有发现{destination.name.zh}。快速旅行需先徒步或骑马到访一次。
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={doTravel} disabled={!canFast} className="btn btn-primary">
                  <Route size={14} /> 开始旅行
                </button>
                <button type="button" onClick={() => setDestination(null)} className="btn btn-ghost">
                  取消
                </button>
              </div>
            </Panel>
          )}

          {!destination && !origin && (
            <Panel className="p-5">
              <EmptyState
                title="还没有冒险者档案"
                hint="先创建角色，才能记录你的旅行。"
                action={
                  <a href="/profile" className="btn btn-primary btn-sm">
                    前往档案
                  </a>
                }
              />
            </Panel>
          )}
        </div>

        {/* ---------------- 侧栏 ---------------- */}
        <aside className="space-y-5">
          <Panel className="p-4">
            <SectionHeading title="旅途笔记" eyebrow="NOTES" />
            <ul className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-parchment/55">
              <li className="flex gap-2"><Compass size={12} className="mt-0.5 shrink-0 text-gold/60" />旅行会推进世界时间，天气与昼夜氛围随之改变。</li>
              <li className="flex gap-2"><MapPin size={12} className="mt-0.5 shrink-0 text-gold/60" />经过的地标会自动标记为「已发现」。</li>
              <li className="flex gap-2"><Sparkles size={12} className="mt-0.5 shrink-0 text-gold/60" />自动生成的日记可在世界日记中自由修改。</li>
            </ul>
          </Panel>

          <Panel className="p-4">
            <SectionHeading title="世界时间" eyebrow="WORLD CLOCK" />
            <p className="mt-3 text-[12px] text-parchment/80">第四纪元 201 年</p>
            <p className="mt-1 font-display text-[16px] text-gold-soft">{formatWorldTime(world)}</p>
            <p className="mt-1 text-[11px] text-parchment/45">{worldPhase(world.hour)} · 第 {world.day} 日</p>
          </Panel>

          {world.log.length > 0 && (
            <Panel className="p-4">
              <SectionHeading title="最近的足迹" eyebrow="RECENT STEPS" />
              <ul className="mt-3 space-y-2.5">
                {world.log.slice(0, 5).map((l) => (
                  <li key={l.id} className="flex gap-2 text-[11px] leading-relaxed text-parchment/55">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold/60" />
                    {l.text}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  )
}
