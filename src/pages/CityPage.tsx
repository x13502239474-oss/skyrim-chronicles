import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Flag, Footprints, Store, Star, Users } from 'lucide-react'
import { charactersFor, cityPlaces, cityById, dangerLabel, locationsFor, questsFor, regionLabel } from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { CharacterCard, PlaceCard } from '@/components/cards'
import { Badge, Chip, ChipRow, EmptyState, Hairline, Parchment, Prose, SectionHeading, cn } from '@/components/ui'
import { usePlayer } from '@/store/PlayerContext'
import type { LocationType } from '@/types'

const groups: { id: string; label: string; types: LocationType[] }[] = [
  { id: 'all', label: '全部', types: [] },
  { id: 'hall', label: '宫殿与厅堂', types: ['hall', 'castle', 'college'] },
  { id: 'shop', label: '商铺与铁匠', types: ['shop'] },
  { id: 'tavern', label: '酒馆旅店', types: ['tavern'] },
  { id: 'temple', label: '神庙与墓室', types: ['temple'] },
  { id: 'other', label: '其它', types: ['mine', 'dock', 'landmark', 'grove', 'fort', 'ruin'] },
]

export default function CityPage() {
  const { cityId } = useParams<{ cityId: string }>()
  const city = cityId ? cityById[cityId] : undefined
  const { exploration, profile, discover, toggleFavorite, updateProfile, advanceHours, logEvent, notify } = usePlayer()
  const [tab, setTab] = useState('all')

  if (!city) {
    return (
      <div className="py-16">
        <EmptyState
          title="未找到这座城市"
          hint="它可能尚未被记录进编年史。"
          action={<Link to="/world" className="btn btn-sm btn-ghost">返回世界地图</Link>}
        />
      </div>
    )
  }

  const places = cityPlaces(city)
  const rec = exploration[city.id]
  const people = charactersFor(city.characterIds)
  const quests = questsFor(Array.from(new Set(city.questIds)))
  const nearby = locationsFor(city.nearbyIds)
  const ruler = city.rulerId ? charactersFor([city.rulerId])[0] : undefined
  const active = tab === 'all' ? places : places.filter((p) => groups.find((g) => g.id === tab)?.types.includes(p.type))

  const visit = () => {
    if (!profile) {
      notify('请先创建你的角色。')
      return
    }
    discover(city.id)
    updateProfile({ locationId: city.id })
    advanceHours(4)
    logEvent(`我进入了${city.name.zh}。`)
    notify(`已抵达${city.name.zh}。`)
  }

  return (
    <div>
      <PageHeader
        eyebrow={city.type === 'city' ? 'City of Skyrim' : 'Town of Skyrim'}
        title={city.name.zh}
        en={city.name.en}
        sub={city.summary}
        palette={city.palette}
        seed={city.name.en.length + 7}
        crumbs={[
          { to: '/', label: '营地' },
          { to: '/world', label: '世界探索' },
          { to: `/region/${city.regionId}`, label: regionLabel(city.regionId) },
          { label: city.name.zh },
        ]}
        actions={
          <>
            <button type="button" onClick={visit} className="btn btn-primary">
              <Footprints size={13} /> 在此驻足
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(city.id)}
              className={cn('btn btn-ghost', rec?.favorited && 'text-gold')}
            >
              <Star size={13} fill={rec?.favorited ? 'currentColor' : 'none'} /> 收藏
            </button>
          </>
        }
        meta={
          <>
            <span>人口 · {city.population}</span>
            <span>统治者 · {city.rulerName}</span>
            <span>{places.length} 处城内地点</span>
            <span>{people.length} 位居民</span>
            {rec?.discovered && <span className="text-gold/70">已访问</span>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        <div className="min-w-0 space-y-8">
          {/* 历史与地理 */}
          <section>
            <SectionHeading eyebrow="History" title="城市历史" />
            <Prose>
              {city.history.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </section>

          <section>
            <SectionHeading eyebrow="Geography" title="地理与格局" />
            <Prose>
              {city.geography.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </section>

          {/* 城内地点 */}
          <section>
            <SectionHeading
              eyebrow="Within the Walls"
              title="城内地点"
              sub="点击任意地点进入详情页，查看背景、人员、敌人与相关任务。"
            />
            <ChipRow className="mb-3">
              {groups.map((g) => (
                <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
                  {g.label}
                </Chip>
              ))}
            </ChipRow>
            {active.length === 0 ? (
              <EmptyState title="该分类下暂无记录" hint="切换其它分类继续浏览。" />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {active.map((p) => (
                  <PlaceCard key={p.id} l={p} />
                ))}
              </div>
            )}
          </section>

          {/* 商人 */}
          <section>
            <SectionHeading eyebrow="Merchants & Services" title="商人与服务" sub="城中可以交易、休息与学习的地方。" />
            <div className="divide-y divide-parchment/8 border border-gold/12">
              {city.services.map((s) => {
                const keeper = s.keeperId ? charactersFor([s.keeperId])[0] : undefined
                return (
                  <div key={`${s.type}-${s.name}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] text-parchment/85">{s.name}</p>
                      <p className="text-[10.5px] text-parchment/35">
                        {s.type}
                        {keeper ? ` · ${keeper.name.zh}` : ''}
                      </p>
                    </div>
                    <Store size={12} className="shrink-0 text-gold/40" />
                  </div>
                )
              })}
            </div>
          </section>

          {/* 人物 */}
          <section>
            <SectionHeading eyebrow="Residents" title="重要居民" />
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((c) => (
                <CharacterCard key={c.id} c={c} />
              ))}
            </div>
          </section>

          {/* 任务 */}
          <section>
            <SectionHeading eyebrow="Quests" title="相关任务" />
            <div className="space-y-1.5">
              {quests.map((q) => (
                <Link
                  key={q.id}
                  to={`/quests?focus=${q.id}`}
                  className="flex items-center justify-between gap-3 border-b border-parchment/8 py-2 last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-parchment/82">{q.name.zh}</span>
                    <span className="block truncate text-[10.5px] text-parchment/35">{q.giverName} · {q.summary}</span>
                  </span>
                  <ArrowRight size={12} className="shrink-0 text-parchment/20" />
                </Link>
              ))}
            </div>
          </section>

          {/* 周边 */}
          {nearby.length > 0 && (
            <section>
              <SectionHeading eyebrow="Surroundings" title="周边地点" sub="从城门出发，步行可达的地方。" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {nearby.map((l) => (
                  <PlaceCard key={l.id} l={l} />
                ))}
              </div>
            </section>
          )}

          {/* 传闻 */}
          <section>
            <SectionHeading eyebrow="Rumors" title="城市传闻" sub="酒馆里听来的消息，未必句句属实。" />
            <Parchment className="p-4 sm:p-5">
              <ul className="space-y-2.5">
                {city.rumors.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-[1.9] text-[#3a2d1c]">
                    <span className="text-[#8a6a3a]">❝</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Parchment>
          </section>
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="panel corner-frame p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">城市档案</p>
            <dl className="space-y-2 text-[11.5px]">
              {[
                ['类型', city.type === 'city' ? '城市' : '城镇'],
                ['所属', regionLabel(city.regionId)],
                ['人口', city.population],
                ['统治者', city.rulerName],
                ['总管', city.stewardName ?? '—'],
                ['侍卫长', city.housecarlName ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-parchment/35">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-parchment/75">{v}</dd>
                </div>
              ))}
            </dl>
            <Hairline />
            <p className="text-[11.5px] leading-relaxed text-parchment/55">
              <span className="text-gold/60">政治地位 · </span>
              {city.politics}
            </p>
          </div>

          {ruler && (
            <div className="panel p-4">
              <p className="eyebrow mb-2 text-[8px] text-parchment/35">统治者</p>
              <CharacterCard c={ruler} compact />
            </div>
          )}

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">我的访问记录</p>
            {rec?.discovered ? (
              <div className="space-y-2">
                <Badge tone="moss">
                  <Flag size={9} /> 已访问
                </Badge>
                <p className="text-[11px] leading-relaxed text-parchment/45">
                  {rec.visitedAt ? `首次记录于 ${new Date(rec.visitedAt).toLocaleDateString('zh-CN')}` : '已留下足迹。'}
                </p>
                {rec.note && <p className="border-l-2 border-gold/25 pl-2 text-[11px] text-parchment/55">{rec.note}</p>}
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-parchment/40">
                你还没有到过这里。点击「在此驻足」记录你的第一次到访。
              </p>
            )}
          </div>

          {nearby.length > 0 && (
            <div className="panel p-4">
              <p className="eyebrow mb-2 text-[8px] text-parchment/35">周边危险度</p>
              <div className="space-y-1.5">
                {nearby.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-parchment/60">{l.name.zh}</span>
                    <span className={cn('shrink-0', l.danger >= 4 ? 'text-[#d68b7e]' : 'text-parchment/35')}>{dangerLabel(l.danger)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">快捷</p>
            <div className="flex flex-wrap gap-1.5">
              <Link to={`/region/${city.regionId}`} className="btn btn-sm btn-ghost">
                <Users size={11} /> 所属领地
              </Link>
              <Link to="/world" className="btn btn-sm btn-ghost">
                地图
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
