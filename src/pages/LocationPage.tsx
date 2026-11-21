import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Coins, Flag, Footprints, ShieldAlert, Star, Swords } from 'lucide-react'
import {
  charactersAtLocation,
  cityById,
  dangerLabel,
  holdOfCity,
  itemsForLocation,
  locationById,
  locationsFor,
  locationTypeLabels,
  questsFor,
  regionLabel,
} from '@/data'
import { scenePalettes } from '@/data/regions'
import { PageHeader } from '@/components/PageHeader'
import { CharacterCard, ItemGlyph, PlaceCard } from '@/components/cards'
import { Badge, EmptyState, Hairline, SectionHeading, Prose, cn } from '@/components/ui'
import { usePlayer } from '@/store/PlayerContext'
import type { ScenePalette } from '@/types'

export default function LocationPage() {
  const { locationId } = useParams<{ locationId: string }>()
  const l = locationId ? locationById[locationId] : undefined
  const { exploration, profile, discover, unmarkDiscovered, toggleFavorite, setExplorationNote, addJournal, notify, logEvent } = usePlayer()
  const [note, setNote] = useState('')

  if (!l) {
    return (
      <div className="py-16">
        <EmptyState
          title="未找到该地点"
          hint="它可能尚未被记录，或已被从编年史中抹去。"
          action={<Link to="/world" className="btn btn-sm btn-ghost">返回世界地图</Link>}
        />
      </div>
    )
  }

  const rec = exploration[l.id]
  const city = l.cityId ? cityById[l.cityId] : undefined
  const palette: ScenePalette = city?.palette ?? scenePalettes[l.regionId] ?? scenePalettes.whiterun
  const people = charactersAtLocation(l.id)
  const quests = questsFor(l.questIds)
  const items = itemsForLocation(l.id)
  const siblings = city ? locationsFor(city.districtIds).filter((x) => x.id !== l.id) : []

  const toggle = () => {
    if (rec?.discovered) {
      unmarkDiscovered(l.id)
      notify('已撤销探索标记。')
    } else {
      discover(l.id)
      logEvent(`我探索了${l.name.zh}。`)
      notify(`已记录：抵达${l.name.zh}。`)
    }
  }

  const writeJournal = () => {
    if (!profile) {
      notify('请先创建你的角色。')
      return
    }
    addJournal({
      title: `抵达${l.name.zh}`,
      body: `${l.summary}\n\n（在这里写下你亲眼所见的事物。）`,
      inWorldDate: `第 ${new Date().getFullYear()} 年 · 第 ${l.name.en.length + 1} 日`,
      locationId: l.id,
      characterIds: people.slice(0, 2).map((c) => c.id),
      questIds: quests.slice(0, 2).map((q) => q.id),
      tags: [locationTypeLabels[l.type]?.zh ?? l.type],
      images: [],
    })
    notify('已生成一篇日记草稿，可在日记页编辑。')
  }

  return (
    <div>
      <PageHeader
        eyebrow={locationTypeLabels[l.type]?.en ?? 'Location'}
        title={l.name.zh}
        en={l.name.en}
        sub={l.summary}
        palette={palette}
        seed={l.name.en.length + 2}
        crumbs={[
          { to: '/', label: '营地' },
          { to: '/world', label: '世界探索' },
          { to: `/region/${l.regionId}`, label: regionLabel(l.regionId) },
          ...(city ? [{ to: `/city/${city.id}`, label: city.name.zh }] : []),
          { label: l.name.zh },
        ]}
        actions={
          <>
            <button type="button" onClick={toggle} className={cn('btn', rec?.discovered ? 'btn-ghost' : 'btn-primary')}>
              <Flag size={13} /> {rec?.discovered ? '撤销探索' : '标记已探索'}
            </button>
            <button
              type="button"
              onClick={() => toggleFavorite(l.id)}
              className={cn('btn btn-ghost', rec?.favorited && 'text-gold')}
            >
              <Star size={13} fill={rec?.favorited ? 'currentColor' : 'none'} /> 收藏
            </button>
          </>
        }
        meta={
          <>
            <span>{locationTypeLabels[l.type]?.zh ?? l.type}</span>
            <span className={cn(l.danger >= 4 ? 'text-[#d68b7e]' : l.danger >= 3 ? 'text-gold-soft' : 'text-parchment/50')}>
              危险度 · {dangerLabel(l.danger)}
            </span>
            {l.access && <span>通行 · {l.access === 'public' ? '开放' : l.access === 'restricted' ? '受限' : '敌对'}</span>}
            {l.interior && <span>室内区域</span>}
            {city && <span>{city.name.zh}</span>}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        <div className="min-w-0 space-y-8">
          <section>
            <SectionHeading eyebrow="Lore" title="地点志" />
            <Prose>
              {l.lore.length > 0 ? (
                l.lore.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p className="text-parchment/40">这处地点的详细记载尚待补充。</p>
              )}
            </Prose>
          </section>

          {(l.enemies?.length || l.loot?.length) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {l.enemies && l.enemies.length > 0 && (
                <div className="panel p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-[#d68b7e]">
                    <Swords size={12} /> 已知敌人
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {l.enemies.map((e) => (
                      <Badge key={e} tone="blood">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {l.loot && l.loot.length > 0 && (
                <div className="panel p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.14em] text-gold-soft">
                    <Coins size={12} /> 可得之物
                  </p>
                  <ul className="space-y-1 text-[11.5px] text-parchment/60">
                    {l.loot.map((x) => (
                      <li key={x} className="flex gap-1.5">
                        <span className="text-gold/40">·</span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {people.length > 0 && (
            <section>
              <SectionHeading eyebrow="People" title="此处的人物" sub={`${people.length} 位可在此遇见的人。`} />
              <div className="grid gap-2 sm:grid-cols-2">
                {people.map((c) => (
                  <CharacterCard key={c.id} c={c} />
                ))}
              </div>
            </section>
          )}

          {quests.length > 0 && (
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
                      <span className="block truncate text-[10.5px] text-parchment/35">{q.summary}</span>
                    </span>
                    <ArrowRight size={12} className="shrink-0 text-parchment/20" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {items.length > 0 && (
            <section>
              <SectionHeading eyebrow="Relics" title="与此地相关的收藏品" />
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((it) => (
                  <Link
                    key={it.id}
                    to={`/collections?focus=${it.id}`}
                    className="flex items-center gap-2.5 border border-gold/12 bg-coal/25 p-2.5 transition-colors hover:border-gold/40"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/25 text-gold-soft">
                      <ItemGlyph name={it.glyph} size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] text-parchment/85">{it.name.zh}</span>
                      <span className="block truncate text-[10px] text-parchment/35">{it.subtype}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {siblings.length > 0 && (
            <section>
              <SectionHeading eyebrow="Nearby" title="同一座城中的其它地点" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {siblings.slice(0, 6).map((s) => (
                  <PlaceCard key={s.id} l={s} />
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionHeading eyebrow="Journal" title="记录你在此处的见闻" />
            <textarea
              value={note || (rec?.note ?? '')}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => setExplorationNote(l.id, note)}
              rows={4}
              placeholder="黑暗中有水滴落的声音，石壁上的符文仍在微微发亮……"
              className="textarea"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setExplorationNote(l.id, note)} className="btn btn-sm btn-ghost">
                保存探索笔记
              </button>
              <button type="button" onClick={writeJournal} className="btn btn-sm btn-ghost">
                生成日记草稿
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="panel corner-frame p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">地点档案</p>
            <dl className="space-y-2 text-[11.5px]">
              {[
                ['类型', locationTypeLabels[l.type]?.zh ?? l.type],
                ['所在领地', regionLabel(l.regionId)],
                ['所属城市', city?.name.zh ?? (l.interior ? '城内' : '野外')],
                ['危险度', dangerLabel(l.danger)],
                ['通行', l.access === 'public' ? '开放' : l.access === 'restricted' ? '受限' : l.access === 'hostile' ? '敌对' : '—'],
                ['相关任务', `${quests.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-parchment/35">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-parchment/75">{v}</dd>
                </div>
              ))}
            </dl>
            <Hairline />
            <div className="flex items-center gap-1.5">
              {rec?.discovered ? <Badge tone="moss">已探索</Badge> : <Badge tone="muted">未探索</Badge>}
              {rec?.favorited && <Badge tone="gold">已收藏</Badge>}
            </div>
          </div>

          {city && (
            <Link to={`/city/${city.id}`} className="panel block p-4 transition-colors hover:border-gold/40">
              <p className="eyebrow mb-1 text-[8px] text-parchment/35">所属城市</p>
              <p className="text-[13px] text-parchment/88">{city.name.zh}</p>
              <p className="mt-1 text-[10.5px] text-parchment/40">
                {holdOfCity(city.id) ? regionLabel(holdOfCity(city.id)!) : '索瑟姆'} · {city.population}
              </p>
            </Link>
          )}

          <div className="panel p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] text-parchment/55">
              <ShieldAlert size={12} className="text-gold/60" /> 建议
            </p>
            <p className="text-[11px] leading-relaxed text-parchment/45">
              {l.danger === 0
                ? '此处相对安全，适合在旅程早期停留、补给与打听消息。'
                : l.danger <= 2
                  ? '低危区域，但仍需留意野兽与盗匪。'
                  : l.danger === 3
                    ? '危险度中等：带上治疗药水与足够的箭矢。'
                    : l.danger === 4
                      ? '高危区域，建议等级 15 以上再进入。'
                      : '致命危险。若无充分准备，请勿独自进入。'}
            </p>
          </div>

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">快捷</p>
            <div className="flex flex-wrap gap-1.5">
              <Link to="/world" className="btn btn-sm btn-ghost">
                <Footprints size={11} /> 地图
              </Link>
              <Link to="/quests" className="btn btn-sm btn-ghost">
                任务
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
