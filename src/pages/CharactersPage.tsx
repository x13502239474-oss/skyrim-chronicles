import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MessageCircle, Search, Users } from 'lucide-react'
import {
  characterById,
  characters,
  factionsFor,
  locationsFor,
  questsFor,
  races,
  regionLabel,
  relatedCharacters,
} from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { Portrait, portraitFor } from '@/components/Portrait'
import { Sigil } from '@/components/cards'
import { Badge, Chip, ChipRow, EmptyState, Hairline, SearchInput, Sheet, cn } from '@/components/ui'
import { relationKindLabels } from '@/lib/labels'
import { usePlayer } from '@/store/PlayerContext'
import type { Character } from '@/types'

const categoryOf = (c: Character): string => {
  const f = c.factionIds
  const r = c.role
  if (f.includes('companions')) return '战友团'
  if (f.includes('thieves-guild')) return '盗贼公会'
  if (f.includes('dark-brotherhood')) return '黑暗兄弟会'
  if (f.includes('college')) return '冬堡学院'
  if (f.includes('greybeards') || f.includes('blades')) return '灰胡子与刀锋会'
  if (f.includes('imperial')) return '帝国军团'
  if (f.includes('stormcloaks')) return '风暴斗篷'
  if (f.includes('thalmor')) return '梭默'
  if (f.includes('dawnguard') || f.includes('vampires')) return '黎明守卫与吸血鬼'
  if (f.includes('house-redoran') || f.includes('telvanni') || f.includes('skaal')) return '索瑟姆'
  if (/领主|管家|侍卫|贵族|家主|宫廷/.test(r)) return '领主与宫廷'
  if (/商人|店主|杂货|铁匠|药剂|炼金|裁缝|香料|马夫/.test(r)) return '商人与工匠'
  if (/旅店|酒馆|酒保/.test(r)) return '酒馆与旅店'
  if (/祭司/.test(r)) return '神庙与祭司'
  return '居民与其它'
}

const categories = [
  '全部',
  '领主与宫廷',
  '商人与工匠',
  '酒馆与旅店',
  '神庙与祭司',
  '战友团',
  '盗贼公会',
  '黑暗兄弟会',
  '冬堡学院',
  '灰胡子与刀锋会',
  '帝国军团',
  '风暴斗篷',
  '梭默',
  '黎明守卫与吸血鬼',
  '索瑟姆',
  '居民与其它',
]

/* ---------------------------------------------------------------- */
/* 关系网络                                                          */
/* ---------------------------------------------------------------- */

function RelationWeb({ c, onPick }: { c: Character; onPick: (id: string) => void }) {
  const rel = relatedCharacters(c.id).slice(0, 8)
  if (rel.length === 0) return <p className="text-[11.5px] text-parchment/35">尚未记录此人的人际关系。</p>

  const W = 320
  const H = 260
  const cx = W / 2
  const cy = H / 2
  const radius = 96

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="人物关系网络">
      {rel.map((r, i) => {
        const angle = (i / rel.length) * Math.PI * 2 - Math.PI / 2
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius * 0.82
        return (
          <g key={r.other.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#c9a227" strokeOpacity="0.25" strokeWidth="1" />
            <circle cx={x} cy={y} r="3" fill="#c9a227" fillOpacity="0.7" />
            <text x={x} y={y + 13} textAnchor="middle" fontSize="8.5" fill="#ece0c4" fillOpacity="0.6">
              {r.other.name.zh}
            </text>
            <text x={x} y={y + 22} textAnchor="middle" fontSize="7" fill="#c9a227" fillOpacity="0.55">
              {relationKindLabels[r.relation.kind]}
            </text>
            <circle
              cx={x}
              cy={y}
              r="11"
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onPick(r.other.id)}
            />
          </g>
        )
      })}
      <circle cx={cx} cy={cy} r="15" fill="#241a13" stroke="#c9a227" strokeOpacity="0.6" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fill="#e0c483">
        {c.name.zh.slice(0, 3)}
      </text>
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* 人物详情                                                          */
/* ---------------------------------------------------------------- */

function CharacterDetail({ c, onPick }: { c: Character; onPick: (id: string) => void }) {
  const { updateProfile, notify } = usePlayer()
  const race = races.find((r) => r.id === c.race)
  const factions = factionsFor(c.factionIds)
  const loc = locationsFor([c.locationId])[0]
  const quests = questsFor(c.questIds)
  const [spoken, setSpoken] = useState<number[]>([])

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Portrait spec={portraitFor(c)} race={c.race} size={84} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[19px] leading-tight text-parchment">{c.name.zh}</h2>
          <p className="mt-1 text-[10px] tracking-[0.16em] text-parchment/30 uppercase">{c.name.en}</p>
          <p className="mt-1.5 text-[12px] text-gold-soft/75">{c.title || c.role}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="muted">{race?.name.zh}</Badge>
            <Badge tone="muted">{c.gender === 'male' ? '男性' : '女性'}</Badge>
            <Badge tone="gold">{regionLabel(c.regionId)}</Badge>
            {c.essential && <Badge tone="moss">不可杀</Badge>}
          </div>
        </div>
      </div>

      <p className="text-[12.5px] leading-[1.9] text-parchment/65">{c.summary}</p>

      <div className="grid grid-cols-2 gap-3 border-y border-gold/12 py-3">
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">身份</p>
          <p className="text-[12px] text-parchment/78">{c.role}</p>
        </div>
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">常驻地点</p>
          {loc ? (
            <Link to={`/location/${loc.id}`} className="truncate text-[12px] text-parchment/78 hover:text-gold-soft">
              {loc.name.zh}
            </Link>
          ) : (
            <p className="text-[12px] text-parchment/50">—</p>
          )}
        </div>
      </div>

      {c.background.length > 0 && (
        <div>
          <p className="eyebrow mb-2 text-[8px] text-parchment/35">背景</p>
          <div className="prose-lore space-y-2 text-[12.5px] leading-[1.95] text-parchment/58">
            {c.background.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      {c.personality && (
        <p className="border-l-2 border-gold/25 pl-3 text-[12px] leading-relaxed text-parchment/50">
          <span className="text-gold/60">性格 · </span>
          {c.personality}
        </p>
      )}

      {factions.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">所属势力</p>
          <div className="flex flex-wrap gap-1.5">
            {factions.map((f) => (
              <Link
                key={f.id}
                to={`/factions?focus=${f.id}`}
                className="flex items-center gap-1.5 border border-parchment/12 px-2 py-1 text-[11px] text-parchment/65 hover:border-gold/40"
              >
                <Sigil name={f.glyph} size={10} />
                {f.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      {c.services && c.services.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">可提供的服务</p>
          <div className="flex flex-wrap gap-1.5">
            {c.services.map((s) => (
              <Badge key={s} tone="gold">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 对话 */}
      {c.dialogue.length > 0 && (
        <div>
          <p className="eyebrow mb-2 flex items-center gap-1.5 text-[8px] text-parchment/35">
            <MessageCircle size={9} /> 预设对话
          </p>
          <div className="space-y-1.5">
            {c.dialogue.map((d, i) => (
              <div key={i} className="border border-parchment/10 bg-coal/25 p-2.5">
                <button
                  type="button"
                  onClick={() => setSpoken((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <span className="text-[12px] text-parchment/78">
                    <span className="text-gold/50">你 · </span>
                    {d.prompt}
                  </span>
                  <span className="shrink-0 text-[9px] text-parchment/25">{spoken.includes(i) ? '收起' : '询问'}</span>
                </button>
                {spoken.includes(i) && (
                  <p className="mt-1.5 border-t border-gold/10 pt-1.5 text-[12px] leading-[1.85] text-parchment/55">
                    <span className="text-gold/50">{c.name.zh} · </span>
                    {d.reply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 关系 */}
      <div>
        <p className="eyebrow mb-2 text-[8px] text-parchment/35">关系网络</p>
        <div className="border border-gold/12 bg-coal/25 p-1">
          <RelationWeb c={c} onPick={onPick} />
        </div>
        <div className="mt-2 space-y-1">
          {relatedCharacters(c.id)
            .slice(0, 8)
            .map((r) => (
              <button
                key={r.other.id}
                type="button"
                onClick={() => onPick(r.other.id)}
                className="flex w-full items-center justify-between gap-2 border-b border-parchment/6 py-1.5 text-left last:border-0 hover:bg-parchment/4"
              >
                <span className="min-w-0 truncate text-[11.5px] text-parchment/70">{r.other.name.zh}</span>
                <span className="shrink-0 text-[10px] text-gold/55">
                  {relationKindLabels[r.relation.kind]}
                  {r.relation.label ? ` · ${r.relation.label}` : ''}
                </span>
              </button>
            ))}
        </div>
      </div>

      {quests.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">相关任务</p>
          <div className="space-y-1">
            {quests.slice(0, 8).map((q) => (
              <Link key={q.id} to={`/quests?focus=${q.id}`} className="block truncate py-1 text-[11.5px] text-parchment/65 hover:text-gold-soft">
                · {q.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Hairline />
      <button
        type="button"
        onClick={() => {
          updateProfile({ locationId: c.locationId })
          notify(`你前往${loc?.name.zh ?? '该地点'}寻找${c.name.zh}。`)
        }}
        className="btn btn-sm btn-ghost w-full"
      >
        前往拜访
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 页面                                                              */
/* ---------------------------------------------------------------- */

export default function CharactersPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const [region, setRegion] = useState('全部')
  const [selected, setSelected] = useState<string>(params.get('focus') ?? characters[0].id)
  const [sheetOpen, setSheetOpen] = useState(Boolean(params.get('focus')))

  const regions = useMemo(() => ['全部', ...Array.from(new Set(characters.map((c) => regionLabel(c.regionId))))], [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return characters.filter((c) => {
      if (category !== '全部' && categoryOf(c) !== category) return false
      if (region !== '全部' && regionLabel(c.regionId) !== region) return false
      if (q && !c.name.zh.toLowerCase().includes(q) && !c.name.en.toLowerCase().includes(q) && !c.role.includes(q)) return false
      return true
    })
  }, [query, category, region])

  const current = characterById[selected]

  const pick = (id: string) => {
    setSelected(id)
    setSheetOpen(true)
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Characters & Relationships"
        title="人物与关系"
        en="People of Skyrim"
        sub="从领主到乞丐，每一个人都有自己的立场、口音与秘密。点击人物，查看背景、关系与对话。"
        crumbs={[{ to: '/', label: '营地' }, { label: '人物与关系' }]}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <Users size={11} className="text-gold/60" /> {characters.length} 位人物
            </span>
            <span>{list.length} 位符合筛选</span>
          </>
        }
      />

      <div className="mb-3 space-y-2">
        <SearchInput value={query} onChange={setQuery} placeholder="搜索姓名或身份…" className="sm:max-w-sm" />
        <ChipRow>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow>
          {regions.map((r) => (
            <Chip key={r} active={region === r} onClick={() => setRegion(r)}>
              {r}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
        <div>
          {list.length === 0 ? (
            <EmptyState
              title="没有找到符合条件的人物"
              hint="尝试更换分类或搜索词。"
              action={
                <button type="button" onClick={() => { setQuery(''); setCategory('全部'); setRegion('全部') }} className="btn btn-sm btn-ghost">
                  <Search size={11} /> 清除筛选
                </button>
              }
            />
          ) : (
            <>
              <p className="mb-2 text-[10.5px] text-parchment/30">共 {list.length} 位，显示前 60 位</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {list.slice(0, 60).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c.id)}
                    className={cn(
                      'panel flex items-start gap-2.5 p-2.5 text-left transition-colors',
                      selected === c.id ? 'border-gold/50' : 'hover:border-gold/30',
                    )}
                  >
                    <Portrait spec={portraitFor(c)} race={c.race} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-parchment/88">{c.name.zh}</span>
                      <span className="block truncate text-[10.5px] text-parchment/40">{c.role}</span>
                      <span className="mt-0.5 block truncate text-[9.5px] text-parchment/25">{regionLabel(c.regionId)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="panel hidden max-h-[75vh] overflow-y-auto p-4 lg:block">
          {current ? <CharacterDetail c={current} onPick={setSelected} /> : <EmptyState title="选择一位人物" />}
        </aside>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="人物资料">
        {current ? <CharacterDetail c={current} onPick={(id) => setSelected(id)} /> : <EmptyState title="选择一位人物" />}
      </Sheet>
    </div>
  )
}
