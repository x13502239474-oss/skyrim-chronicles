import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Compass, Flag, Footprints, MapPin } from 'lucide-react'
import {
  charactersFor,
  cities,
  cityById,
  factionsFor,
  holdById,
  locationsFor,
  questsFor,
  solstheim,
} from '@/data'
import { scenePalettes } from '@/data/regions'
import { PageHeader } from '@/components/PageHeader'
import { CharacterCard, CityCard, PlaceCard, ShieldSigil } from '@/components/cards'
import { Badge, ChipRow, Chip, EmptyState, Hairline, SectionHeading, Prose, ProgressBar, cn } from '@/components/ui'
import { usePlayer } from '@/store/PlayerContext'
import type { HoldId, LocationType, ScenePalette } from '@/types'
import { useState } from 'react'

const townTypes: LocationType[] = ['city', 'town', 'village', 'farm']
const ruinTypes: LocationType[] = ['nordic-ruin', 'dwemer-ruin', 'ruin', 'dragon-shrine', 'cave', 'mine', 'fort', 'castle', 'camp', 'stronghold']
const civicTypes: LocationType[] = ['shop', 'tavern', 'temple', 'hall', 'college', 'dock', 'lighthouse', 'grove', 'landmark']

export default function RegionPage() {
  const { regionId } = useParams<{ regionId: string }>()
  const [locTab, setLocTab] = useState<'town' | 'ruin' | 'civic'>('town')
  const { exploration, profile, updateProfile, discover, advanceHours, logEvent, notify } = usePlayer()

  const hold = regionId && regionId !== 'solstheim' ? holdById[regionId as HoldId] : undefined
  const isSolstheim = regionId === 'solstheim'

  if (!regionId || (!hold && !isSolstheim)) {
    return (
      <div className="py-16">
        <EmptyState title="未知的领地" hint="这座领地不存在于天际省的记载中。" action={<Link to="/holds" className="btn btn-sm btn-ghost">返回领地一览</Link>} />
      </div>
    )
  }

  const name = hold ? hold.name : solstheim.name
  const summary = hold ? hold.summary : solstheim.summary
  const geography = hold ? hold.geography : solstheim.geography
  const history = hold ? hold.history : solstheim.history
  const palette: ScenePalette = scenePalettes[regionId] ?? scenePalettes.whiterun
  const locationIds = hold ? hold.locationIds : solstheim.locationIds
  const characterIds = hold ? hold.characterIds : solstheim.characterIds
  const factionIds = hold ? hold.factionIds : solstheim.factionIds
  const questIds = hold ? hold.questIds : solstheim.questIds

  const regionLocations = locationsFor(locationIds)
  const regionCities = cities.filter((c) => c.regionId === regionId)
  const regionCharacters = charactersFor(characterIds)
  const regionFactions = factionsFor(factionIds)
  const regionQuests = questsFor(Array.from(new Set(questIds)))

  const discoveredHere = regionLocations.filter((l) => exploration[l.id]?.discovered)
  const notes = regionLocations.filter((l) => exploration[l.id]?.note)
  const pct = regionLocations.length ? Math.round((discoveredHere.length / regionLocations.length) * 100) : 0

  const capitalId = hold ? hold.capitalId : 'raven-rock'
  const capital = cityById[capitalId]
  const jarl = hold ? charactersFor([hold.jarlId])[0] : undefined

  const tour = regionLocations.filter((l) =>
    locTab === 'town' ? townTypes.includes(l.type) : locTab === 'ruin' ? ruinTypes.includes(l.type) : civicTypes.includes(l.type),
  )

  const travel = () => {
    if (!profile) {
      notify('请先创建你的角色。')
      return
    }
    discover(capitalId)
    updateProfile({ locationId: capitalId })
    advanceHours(8)
    logEvent(`我动身前往${capital?.name.zh ?? name.zh}。`)
    notify(`你抵达了${capital?.name.zh ?? name.zh}。`)
  }

  return (
    <div>
      <PageHeader
        eyebrow={isSolstheim ? 'Region · Solstheim' : 'Hold of Skyrim'}
        title={name.zh}
        en={name.en}
        sub={summary}
        palette={palette}
        seed={name.en.length + 3}
        crumbs={[{ to: '/', label: '营地' }, { to: '/holds', label: '领地一览' }, { label: name.zh }]}
        actions={
          <>
            <button type="button" onClick={travel} className="btn btn-primary">
              <Footprints size={13} /> 前往首府
            </button>
            <Link to="/world" className="btn btn-ghost">
              <Compass size={13} /> 在地图上查看
            </Link>
          </>
        }
        meta={
          <>
            {hold ? (
              <>
                <span>首府 · {capital?.name.zh}</span>
                <span>领主 · {hold.jarlName}</span>
                <span className={cn(hold.allegiance === 'imperial' ? 'text-[#c98a7e]' : hold.allegiance === 'stormcloak' ? 'text-frost/85' : 'text-parchment/45')}>
                  {hold.allegiance === 'imperial' ? '帝国控制' : hold.allegiance === 'stormcloak' ? '风暴斗篷控制' : '名义中立'}
                </span>
              </>
            ) : (
              <span>晨风以北 · 亡者之海</span>
            )}
            <span>{regionLocations.length} 处已记录地点</span>
            <span>{regionCharacters.length} 位人物</span>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-8">
          {/* 地理 + 历史 */}
          <section>
            <SectionHeading eyebrow="Geography" title="地理志" />
            <Prose>
              {geography.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
            {hold && (
              <p className="mt-3 border-l-2 border-gold/30 pl-3 text-[12.5px] leading-relaxed text-parchment/50">
                <span className="text-gold/60">气候 · </span>
                {hold.climate}
              </p>
            )}
          </section>

          <section>
            <SectionHeading eyebrow="History" title="历史" />
            <Prose>
              {history.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </section>

          {/* 城市 */}
          {regionCities.length > 0 && (
            <section>
              <SectionHeading eyebrow="Cities & Towns" title="城市与聚落" sub="点击进入城市资料页，查看建筑、商人、居民与传闻。" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {regionCities.map((c) => (
                  <CityCard key={c.id} city={c} />
                ))}
              </div>
            </section>
          )}

          {/* 地点 */}
          <section>
            <SectionHeading
              eyebrow="Locations"
              title="重要地点"
              sub={`共 ${regionLocations.length} 处。切换分类查看城镇、遗迹与城内设施。`}
            />
            <ChipRow className="mb-3">
              <Chip active={locTab === 'town'} onClick={() => setLocTab('town')}>
                城镇与村落
              </Chip>
              <Chip active={locTab === 'ruin'} onClick={() => setLocTab('ruin')}>
                遗迹与野外
              </Chip>
              <Chip active={locTab === 'civic'} onClick={() => setLocTab('civic')}>
                神庙与商铺
              </Chip>
            </ChipRow>
            {tour.length === 0 ? (
              <EmptyState title="该分类下暂无记录" hint="切换到其它分类查看其余地点。" />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {tour.map((l) => (
                  <div key={l.id} className="relative">
                    <PlaceCard l={l} />
                    {exploration[l.id]?.discovered && (
                      <span className="absolute top-2 right-2 text-gold" title="已探索">
                        <Flag size={10} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 人物 */}
          <section>
            <SectionHeading eyebrow="People" title="主要人物" sub="点击查看完整背景、关系与预设对话。" />
            <div className="grid gap-2 sm:grid-cols-2">
              {regionCharacters.slice(0, 12).map((c) => (
                <CharacterCard key={c.id} c={c} />
              ))}
            </div>
            {regionCharacters.length > 12 && (
              <Link to="/characters" className="btn btn-sm btn-ghost mt-3">
                查看全部 {regionCharacters.length} 位人物 <ArrowRight size={12} />
              </Link>
            )}
          </section>

          {/* 势力 */}
          {regionFactions.length > 0 && (
            <section>
              <SectionHeading eyebrow="Factions" title="在此活动的势力" />
              <div className="space-y-2">
                {regionFactions.map((f) => (
                  <Link
                    key={f.id}
                    to={`/factions?focus=${f.id}`}
                    className="flex items-center gap-3 border border-gold/12 bg-coal/25 p-3 transition-colors hover:border-gold/40"
                  >
                    <ShieldSigil sigil={f.glyph} colors={f.colors} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-parchment/88">{f.name.zh}</span>
                      <span className="block text-[11px] text-parchment/40">{f.type}</span>
                    </span>
                    <ArrowRight size={12} className="text-parchment/25" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 任务 */}
          <section>
            <SectionHeading eyebrow="Quests" title="相关任务" sub={`${regionQuests.length} 项与本区域相关的任务。`} />
            <div className="space-y-1.5">
              {regionQuests.slice(0, 14).map((q) => (
                <Link
                  key={q.id}
                  to={`/quests?focus=${q.id}`}
                  className="flex items-center justify-between gap-3 border-b border-parchment/8 py-2 last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-parchment/82">{q.name.zh}</span>
                    <span className="block truncate text-[10.5px] text-parchment/35">{q.summary}</span>
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-parchment/20" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="panel corner-frame p-4">
            <div className="flex items-center gap-3">
              {hold ? (
                <ShieldSigil sigil={hold.sigil} colors={hold.banner} size={42} />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center border border-frost/30 text-frost/70">
                  <Compass size={18} />
                </span>
              )}
              <div>
                <p className="eyebrow text-[8px] text-parchment/35">区域纹章</p>
                <p className="mt-0.5 text-[13px] text-parchment/85">{name.zh}</p>
              </div>
            </div>
            <Hairline />
            <dl className="space-y-2 text-[11.5px]">
              {[
                ['首府', capital?.name.zh ?? '—'],
                ['领主', hold?.jarlName ?? '无（晨风领地）'],
                ['政治归属', hold ? (hold.allegiance === 'imperial' ? '帝国' : hold.allegiance === 'stormcloak' ? '风暴斗篷' : '中立') : '晨风省影响'],
                ['地点总数', `${regionLocations.length}`],
                ['人物', `${regionCharacters.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-parchment/35">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-parchment/75">{v}</dd>
                </div>
              ))}
            </dl>
            {jarl && (
              <>
                <Hairline />
                <Link to={`/characters?focus=${jarl.id}`} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-[8px] text-parchment/35">现任领主</span>
                    <span className="block truncate text-[12.5px] text-parchment/85">{jarl.name.zh}</span>
                  </span>
                  <ArrowRight size={12} className="text-parchment/25" />
                </Link>
              </>
            )}
          </div>

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">我的探索进度</p>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-display text-[16px] text-parchment">{pct}%</span>
              <span className="text-[10.5px] text-parchment/35">
                {discoveredHere.length} / {regionLocations.length}
              </span>
            </div>
            <ProgressBar value={pct} />
            <p className="mt-2 text-[10.5px] leading-relaxed text-parchment/35">
              已收藏 {regionLocations.filter((l) => exploration[l.id]?.favorited).length} 处。在地图或地点页标记探索即可累计。
            </p>
            {profile && (
              <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-parchment/45">
                <MapPin size={10} className="text-gold/60" />
                当前位于 {cityById[profile.locationId]?.name.zh ?? '未知之地'}
              </p>
            )}
          </div>

          {notes.length > 0 && (
            <div className="panel p-4">
              <p className="eyebrow mb-2 text-[8px] text-parchment/35">我的笔记</p>
              <div className="space-y-2.5">
                {notes.slice(0, 5).map((l) => (
                  <div key={l.id}>
                    <p className="text-[11.5px] text-gold-soft/80">{l.name.zh}</p>
                    <p className="mt-0.5 line-clamp-3 text-[11px] leading-relaxed text-parchment/45">{exploration[l.id]?.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">快速跳转</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="muted">第 {regionLocations.length} 处地点</Badge>
              <Badge tone="muted">{regionQuests.length} 项任务</Badge>
              <Badge tone="gold">{regionCharacters.length} 位人物</Badge>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
