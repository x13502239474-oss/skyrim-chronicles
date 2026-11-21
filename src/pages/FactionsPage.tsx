import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Crown, Shield, Swords, Users } from 'lucide-react'
import {
  characterById,
  factions,
  factionById,
  holds,
  locationsFor,
  questsFor,
} from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { Portrait, portraitFor } from '@/components/Portrait'
import { Sigil, ShieldSigil } from '@/components/cards'
import { Badge, Chip, EmptyState, Hairline, SectionHeading, Sheet, cn } from '@/components/ui'
import { allegianceLabels, allegianceTone } from '@/lib/labels'
import { usePlayer } from '@/store/PlayerContext'
import type { Allegiance, Faction } from '@/types'

/* ---------------------------------------------------------------- */
/* 内战推演                                                          */
/* ---------------------------------------------------------------- */

function CivilWarMap() {
  const { world, setAlignment, setHoldControl, notify } = usePlayer()
  const [choice, setChoice] = useState<Allegiance>(world.alignment)

  const projected = (official: Allegiance): Allegiance => {
    if (choice === 'neutral') return official
    if (choice === 'imperial') return official === 'stormcloak' ? 'imperial' : official
    return official === 'imperial' ? 'stormcloak' : official
  }

  return (
    <div className="panel corner-frame p-4">
      <SectionHeading
        eyebrow="Civil War Simulation"
        title="内战推演"
        sub="选择一方，观察九大领地的推演归属。左侧为官方设定立场，右侧为推演结果——两者始终分开标注。"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['imperial', 'stormcloak', 'neutral'] as Allegiance[]).map((a) => (
          <Chip key={a} active={choice === a} onClick={() => setChoice(a)}>
            {a === 'imperial' ? '帝国获胜' : a === 'stormcloak' ? '风暴斗篷获胜' : '维持现状'}
          </Chip>
        ))}
        <button
          type="button"
          onClick={() => {
            setAlignment(choice)
            holds.forEach((h) => setHoldControl(h.id, projected(h.allegiance)))
            notify('推演结果已写入世界状态。')
          }}
          className="btn btn-sm btn-ghost ml-auto"
        >
          应用到世界状态
        </button>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2">
        {holds.map((h) => {
          const after = projected(h.allegiance)
          const changed = after !== h.allegiance
          return (
            <div key={h.id} className={cn('flex items-center gap-2 border px-2.5 py-2', changed ? 'border-gold/35 bg-gold/6' : 'border-parchment/10')}>
              <ShieldSigil sigil={h.sigil} colors={h.banner} size={22} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] text-parchment/85">{h.name.zh}</span>
                <span className="flex items-center gap-1 text-[9.5px] text-parchment/35">
                  官方
                  <span className={h.allegiance === 'imperial' ? 'text-[#c98a7e]' : h.allegiance === 'stormcloak' ? 'text-frost/80' : 'text-parchment/40'}>
                    {allegianceLabels[h.allegiance]}
                  </span>
                  <span className="text-parchment/20">→</span>
                  推演
                  <span className={after === 'imperial' ? 'text-[#c98a7e]' : after === 'stormcloak' ? 'text-frost/80' : 'text-parchment/40'}>
                    {allegianceLabels[after]}
                  </span>
                </span>
              </span>
              {changed && <span className="shrink-0 text-[9px] text-gold/60">变动</span>}
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-parchment/30">
        这是基于领地立场、地理位置与任务线的简化推演，用于观察内战格局的变化，不代表官方剧情走向。
        当前世界状态：{allegianceLabels[world.alignment]}。
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 势力详情                                                          */
/* ---------------------------------------------------------------- */

function FactionDetail({ f }: { f: Faction }) {
  const leader = characterById[f.leaderId]
  const members = f.memberIds.map((id) => characterById[id]).filter(Boolean).slice(0, 12)
  const bases = locationsFor(f.baseIds)
  const quests = questsFor(f.questIds)
  const allies = f.allies.map((id) => factionById[id]).filter(Boolean)
  const enemies = f.enemies.map((id) => factionById[id]).filter(Boolean)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <ShieldSigil sigil={f.glyph} colors={f.colors} size={52} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] leading-tight text-parchment">{f.name.zh}</h2>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-parchment/30 uppercase">{f.name.en}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="gold">{f.type}</Badge>
            {f.joinable && <Badge tone="moss">可加入</Badge>}
          </div>
        </div>
      </div>

      <p className="text-[12.5px] leading-[1.9] text-parchment/65">{f.summary}</p>

      {leader && (
        <Link to={`/characters?focus=${leader.id}`} className="flex items-center gap-2.5 border border-gold/15 bg-coal/25 p-2.5">
          <Portrait spec={portraitFor(leader)} race={leader.race} size={38} />
          <span className="min-w-0 flex-1">
            <span className="eyebrow block text-[8px] text-parchment/35">领袖</span>
            <span className="block truncate text-[12.5px] text-parchment/85">{leader.name.zh}</span>
            <span className="block truncate text-[10px] text-parchment/35">{leader.title || leader.role}</span>
          </span>
        </Link>
      )}

      <div>
        <p className="eyebrow mb-2 text-[8px] text-parchment/35">历史</p>
        <div className="prose-lore space-y-2 text-[12.5px] leading-[1.95] text-parchment/58">
          {f.history.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-2 flex items-center gap-1.5 text-[8px] text-parchment/35">
          <Swords size={9} /> 目标
        </p>
        <ul className="space-y-1 text-[12px] text-parchment/58">
          {f.goals.map((g) => (
            <li key={g} className="flex gap-1.5">
              <span className="text-gold/40">·</span>
              {g}
            </li>
          ))}
        </ul>
      </div>

      {f.structure.length > 0 && (
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5 text-[8px] text-parchment/35">
            <Crown size={9} /> 层级结构
          </p>
          <ol className="space-y-1.5">
            {f.structure.map((s, i) => (
              <li key={s.rank} className="flex gap-2 border-l border-gold/20 pl-2.5">
                <span className="shrink-0 font-display text-[10px] text-gold/45">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block text-[12px] text-parchment/80">{s.rank}</span>
                  <span className="block text-[10.5px] leading-relaxed text-parchment/35">{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {members.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 flex items-center gap-1.5 text-[8px] text-parchment/35">
            <Users size={9} /> 成员
          </p>
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <Link
                key={m.id}
                to={`/characters?focus=${m.id}`}
                className="border border-parchment/12 px-2 py-1 text-[11px] text-parchment/65 hover:border-gold/40 hover:text-gold-soft"
              >
                {m.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      {bases.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">据点</p>
          <div className="flex flex-wrap gap-1.5">
            {bases.map((b) => (
              <Link
                key={b.id}
                to={`/location/${b.id}`}
                className="border border-parchment/12 px-2 py-1 text-[11px] text-parchment/65 hover:border-gold/40 hover:text-gold-soft"
              >
                {b.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(allies.length > 0 || enemies.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {allies.length > 0 && (
            <div>
              <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">盟友</p>
              <div className="flex flex-wrap gap-1">
                {allies.map((a) => (
                  <Badge key={a.id} tone="moss">
                    {a.name.zh}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {enemies.length > 0 && (
            <div>
              <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">敌对</p>
              <div className="flex flex-wrap gap-1">
                {enemies.map((a) => (
                  <Badge key={a.id} tone="blood">
                    {a.name.zh}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {quests.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">相关任务</p>
          <div className="space-y-1">
            {quests.slice(0, 10).map((q) => (
              <Link key={q.id} to={`/quests?focus=${q.id}`} className="block truncate py-1 text-[11.5px] text-parchment/65 hover:text-gold-soft">
                · {q.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Hairline />
      <p className="text-[10.5px] leading-relaxed text-parchment/30">
        势力关系与成员名单基于游戏设定整理。若某项内容尚未收录，会以「待补充」标注，不作虚构填充。
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 页面                                                              */
/* ---------------------------------------------------------------- */

export default function FactionsPage() {
  const [params] = useSearchParams()
  const { world } = usePlayer()
  const [selected, setSelected] = useState<string>(params.get('focus') ?? factions[0].id)
  const [sheetOpen, setSheetOpen] = useState(Boolean(params.get('focus')))
  const [typeFilter, setTypeFilter] = useState('全部')

  const types = ['全部', ...Array.from(new Set(factions.map((f) => f.type)))]
  const list = typeFilter === '全部' ? factions : factions.filter((f) => f.type === typeFilter)
  const current = factionById[selected]

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Factions & Politics"
        title="势力与政治"
        en="Powers of Skyrim"
        sub="九大领地之上，还有军团、教会、公会与古老结社。理解他们的目标，才能理解这场内战的真正代价。"
        crumbs={[{ to: '/', label: '营地' }, { label: '势力与政治' }]}
        meta={<span>{factions.length} 个势力</span>}
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {types.map((t) => (
          <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
        <div className="panel max-h-[70vh] overflow-y-auto p-1.5">
          {list.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSelected(f.id)
                setSheetOpen(true)
              }}
              className={cn(
                'mb-0.5 flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2 text-left transition-colors',
                selected === f.id ? 'border-gold bg-gold/8' : 'border-transparent hover:bg-parchment/4',
              )}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center border"
                style={{ borderColor: `${f.colors[1]}55`, background: `${f.colors[0]}55`, color: f.colors[1] }}
              >
                <Sigil name={f.glyph} size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-[12.5px]', selected === f.id ? 'text-gold-soft' : 'text-parchment/85')}>{f.name.zh}</span>
                <span className="block truncate text-[10px] text-parchment/35">{f.type}</span>
              </span>
              {f.joinable && <span className="shrink-0 text-[8.5px] text-moss">可加入</span>}
            </button>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="panel hidden p-4 sm:p-5 lg:block">{current ? <FactionDetail f={current} /> : <EmptyState title="选择一个势力" />}</div>
          <CivilWarMap />
        </div>
      </div>

      <div className="mt-3 lg:hidden">
        <button type="button" onClick={() => setSheetOpen(true)} className="btn btn-ghost w-full">
          查看势力详情
        </button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="势力详情">
        {current ? <FactionDetail f={current} /> : <EmptyState title="选择一个势力" />}
      </Sheet>

      <div className="mt-8">
        <SectionHeading eyebrow="Allegiance" title="势力立场一览" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setSelected(f.id)
                setSheetOpen(true)
              }}
              className="flex items-start gap-2.5 border border-gold/12 bg-coal/25 p-2.5 text-left transition-colors hover:border-gold/40"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center border"
                style={{ borderColor: `${f.colors[1]}55`, background: `${f.colors[0]}55`, color: f.colors[1] }}
              >
                <Sigil name={f.glyph} size={14} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] text-parchment/85">{f.name.zh}</span>
                <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-parchment/35">{f.summary}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border border-gold/12 bg-coal/20 p-3">
        <Shield size={13} className="text-gold/60" />
        <span className="flex items-center gap-2 text-[11px] text-parchment/40">
          当前世界立场：
          <Badge tone={allegianceTone[world.alignment]}>{allegianceLabels[world.alignment]}</Badge>
        </span>
      </div>
    </div>
  )
}
