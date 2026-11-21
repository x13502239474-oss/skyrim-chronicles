import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Dices, Minus, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { cities, cityById, factions, holds, items, locationById, races, skillGroups, skills, shoutList } from '@/data'
import { usePlayer } from '@/store/PlayerContext'
import { PageHeader } from '@/components/PageHeader'
import { Portrait, portraitFromSeed, raceLook } from '@/components/Portrait'
import { Sigil } from '@/components/cards'
import { Badge, Chip, Field, Hairline, Parchment, Prose, SectionHeading, cn } from '@/components/ui'
import { equipSlotLabels } from '@/lib/labels'
import type { EquipSlot, PlayerProfile, RaceId, SkillId } from '@/types'

const archetypes = ['战士', '法师', '盗贼', '游侠', '佣兵', '吟游诗人', '朝圣者', '学者', '猎手', '流浪者']
const combatStyles = ['单手武器与盾', '双手武器', '双持武器', '弓箭', '毁灭法术', '召唤法术', '恢复法术', '潜行匕首', '重甲战锤', '徒手格斗']
const origins = [...holds.map((h) => h.name.zh), ...cities.map((c) => c.name.zh)]
const joinableFactions = factions.filter((f) => f.joinable)

/* ---------------------------------------------------------------- */
/* 创建向导                                                          */
/* ---------------------------------------------------------------- */

function CreateWizard() {
  const { createProfile, setSkill } = usePlayer()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [race, setRace] = useState<RaceId>('nord')
  const [origin, setOrigin] = useState(origins[0])
  const [archetype, setArchetype] = useState(archetypes[0])
  const [combatStyle, setCombatStyle] = useState(combatStyles[0])
  const [factionId, setFactionId] = useState('')
  const [backstory, setBackstory] = useState('')
  const [seed, setSeed] = useState(7)

  const steps = ['身份', '外貌', '出身', '效忠', '过往', '确认']
  const raceData = races.find((r) => r.id === race)!

  const canNext = step === 0 ? name.trim().length > 0 : true

  const submit = () => {
    createProfile({
      name: name.trim() || '无名龙裔',
      race,
      origin,
      archetype,
      combatStyle,
      backstory:
        backstory.trim() ||
        `${origin}出身的${archetype}，在龙裔的血脉觉醒之前，只是一个试图在天际的寒冬里活下去的普通人。`,
      factionId,
      avatarSeed: seed,
    })
    raceData.bonuses.forEach((b) => setSkill(b.skill as SkillId, 15 + b.amount))
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Adventurer Profile"
        title="创造你的龙裔"
        en="Create Your Dragonborn"
        sub="你从天际省的哪一处雪原醒来？在踏上旅途之前，先让这片土地记住你的名字。"
        crumbs={[{ to: '/', label: '营地' }, { label: '冒险者档案' }]}
      />

      <div className="mx-auto max-w-3xl">
        {/* 步骤指示 */}
        <div className="mb-5 flex items-center gap-1 overflow-x-auto no-bar">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] transition-colors',
                i === step ? 'border-gold text-gold-soft' : i < step ? 'border-gold/30 text-parchment/55' : 'border-transparent text-parchment/30',
              )}
            >
              <span className="font-display">{i + 1}</span>
              {s}
            </button>
          ))}
        </div>

        <div className="panel corner-frame min-h-[380px] p-4 sm:p-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">你叫什么名字？</h2>
                <p className="mt-1 text-[12px] text-parchment/45">这个名字会被守卫、领主与敌人记住。</p>
              </div>
              <Field label="姓名">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：乌尔夫 · 灰雪"
                  className="input"
                  autoFocus
                />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {['乌尔夫', '希雅', '阿尔丹', '莉芙', '卡洛'].map((n) => (
                  <Chip key={n} onClick={() => setName(n)}>
                    {n}
                  </Chip>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="职业倾向">
                  <select value={archetype} onChange={(e) => setArchetype(e.target.value)} className="select">
                    {archetypes.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="战斗风格">
                  <select value={combatStyle} onChange={(e) => setCombatStyle(e.target.value)} className="select">
                    {combatStyles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">你的样貌</h2>
                <p className="mt-1 text-[12px] text-parchment/45">肖像会随你选择的种族与随机种子改变。</p>
              </div>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0">
                  <Portrait spec={portraitFromSeed(seed, race)} race={race} size={132} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {races.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRace(r.id)}
                        className={cn(
                          'border p-2 text-left transition-colors',
                          race === r.id ? 'border-gold/70 bg-gold/12' : 'border-parchment/12 hover:border-parchment/35',
                        )}
                      >
                        <span className="block text-[12px] text-parchment/88">{r.name.zh}</span>
                        <span className="block text-[9.5px] text-parchment/32">{r.name.en}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setSeed((s) => (s * 7 + 13) % 997)} className="btn btn-sm btn-ghost">
                    <Dices size={12} /> 换一副面孔
                  </button>
                </div>
              </div>
              <div className="border border-gold/12 bg-coal/30 p-3">
                <p className="text-[12.5px] text-gold-soft/85">{raceData.name.zh}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-parchment/50">{raceData.summary}</p>
                <p className="mt-1.5 text-[11px] text-parchment/40">
                  <span className="text-gold/55">种族能力 · </span>
                  {raceData.ability}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {raceData.bonuses.map((b) => (
                    <Badge key={b.skill} tone="gold">
                      {skills.find((s) => s.id === b.skill)?.name.zh} +{b.amount}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">你从哪里来？</h2>
                <p className="mt-1 text-[12px] text-parchment/45">出身会影响他人对你的第一印象。</p>
              </div>
              <Field label="出身地">
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="select">
                  {origins.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                {holds.slice(0, 4).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setOrigin(h.name.zh)}
                    className={cn(
                      'border p-2.5 text-left transition-colors',
                      origin === h.name.zh ? 'border-gold/60 bg-gold/10' : 'border-parchment/12 hover:border-parchment/35',
                    )}
                  >
                    <span className="block text-[12px] text-parchment/85">{h.name.zh}</span>
                    <span className="mt-0.5 block line-clamp-1 text-[10px] text-parchment/35">{h.tagline}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-parchment/35">
                你也可以在档案页随时修改出身与职业。天际省不追问过去，但守卫会记得你的脸。
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">你效忠于谁？</h2>
                <p className="mt-1 text-[12px] text-parchment/45">可以暂不选择。效忠并非终身契约，但在内战之中，立场会被记住。</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setFactionId('')}
                  className={cn(
                    'flex items-center gap-3 border p-3 text-left transition-colors',
                    factionId === '' ? 'border-gold/60 bg-gold/10' : 'border-parchment/12 hover:border-parchment/35',
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center border border-parchment/20 text-parchment/50">
                    <X size={14} />
                  </span>
                  <span>
                    <span className="block text-[12.5px] text-parchment/85">保持独立</span>
                    <span className="block text-[10px] text-parchment/35">不加入任何势力</span>
                  </span>
                </button>
                {joinableFactions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFactionId(f.id)}
                    className={cn(
                      'flex items-center gap-3 border p-3 text-left transition-colors',
                      factionId === f.id ? 'border-gold/60 bg-gold/10' : 'border-parchment/12 hover:border-parchment/35',
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center border"
                      style={{ borderColor: `${f.colors[1]}55`, background: `${f.colors[0]}55`, color: f.colors[1] }}
                    >
                      <Sigil name={f.glyph} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] text-parchment/85">{f.name.zh}</span>
                      <span className="block truncate text-[10px] text-parchment/35">{f.type}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">你的过往</h2>
                <p className="mt-1 text-[12px] text-parchment/45">写下你的来历。留空也可以，编年史会为你补上一句。</p>
              </div>
              <Field label="背景故事">
                <textarea
                  value={backstory}
                  onChange={(e) => setBackstory(e.target.value)}
                  rows={7}
                  placeholder="我出生在风盔城的灰区，父亲是名渔夫。那年冬天，帝国的税吏带走了他最后一条船……"
                  className="textarea"
                />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '我曾是军团中的一名士兵，因违抗命令而被除名。',
                  '我在冬堡学院求学，却因一次失败的实验被逐出。',
                  '我在裂谷城的下水道里长大，学会了比读书更实用的东西。',
                  '我的家人死于一场龙袭，我一直在寻找那头龙。',
                ].map((p) => (
                  <Chip key={p} onClick={() => setBackstory((b) => (b ? `${b}\n${p}` : p))}>
                    {p.slice(0, 14)}…
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[17px] text-parchment">确认你的道路</h2>
                <p className="mt-1 text-[12px] text-parchment/45">这一切之后都可以在档案页修改。</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Portrait spec={portraitFromSeed(seed, race)} race={race} size={110} />
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] text-parchment">{name || '无名龙裔'}</p>
                  <p className="mt-1 text-[11.5px] text-parchment/45">
                    {raceData.name.zh} · {origin} 出身 · {archetype}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-parchment/45">战斗风格 · {combatStyle}</p>
                  <p className="mt-0.5 text-[11.5px] text-parchment/45">
                    效忠 · {factionId ? factions.find((f) => f.id === factionId)?.name.zh : '保持独立'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge tone="gold">等级 1</Badge>
                    <Badge tone="muted">100 金币</Badge>
                    <Badge tone="moss">龙裔</Badge>
                  </div>
                </div>
              </div>
              <Parchment className="p-3.5">
                <p className="text-[12.5px] leading-[1.9] text-[#3a2d1c]">
                  {backstory.trim() ||
                    `${origin}出身的${archetype}，在龙裔的血脉觉醒之前，只是一个试图在天际的寒冬里活下去的普通人。`}
                </p>
              </Parchment>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn btn-ghost">
            <ArrowLeft size={13} /> 上一步
          </button>
          {step < 5 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn btn-primary">
              下一步 <ArrowRight size={13} />
            </button>
          ) : (
            <button type="button" onClick={submit} className="btn btn-primary">
              <Sparkles size={13} /> 开始你的编年史
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 档案面板                                                          */
/* ---------------------------------------------------------------- */

function ProfileView({ profile }: { profile: PlayerProfile }) {
  const { updateProfile, setSkill, addTitle, removeTitle, toggleShout, setEquipment, deleteProfile, notify } = usePlayer()
  const [titleInput, setTitleInput] = useState('')
  const race = races.find((r) => r.id === profile.race)
  const faction = factions.find((f) => f.id === profile.factionId)
  const slots: EquipSlot[] = ['head', 'chest', 'hands', 'feet', 'weapon', 'shield', 'amulet', 'ring']

  const itemsForSlot = (slot: EquipSlot) => {
    if (slot === 'weapon') return items.filter((i) => i.category === 'weapon')
    if (slot === 'shield') return items.filter((i) => i.category === 'armor')
    if (slot === 'amulet' || slot === 'ring') return items.filter((i) => ['magic', 'artifact', 'relic'].includes(i.category))
    return items.filter((i) => i.category === 'armor')
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Adventurer Profile"
        title={profile.name}
        en={race?.name.en ?? 'Dragonborn'}
        sub={profile.backstory}
        crumbs={[{ to: '/', label: '营地' }, { label: '冒险者档案' }]}
        actions={
          <Link to="/archive" className="btn btn-sm btn-ghost">
            存档管理
          </Link>
        }
        meta={
          <>
            <span>等级 {profile.level}</span>
            <span>{race?.name.zh}</span>
            <span>{profile.origin} 出身</span>
            <span>{profile.archetype} · {profile.combatStyle}</span>
            {faction && <span>{faction.name.zh}</span>}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* 左：肖像与基础 */}
        <aside className="space-y-4">
          <div className="panel corner-frame p-4 text-center">
            <div className="flex justify-center">
              <Portrait spec={portraitFromSeed(profile.avatarSeed, profile.race)} race={profile.race} size={124} />
            </div>
            <p className="mt-3 text-[16px] text-parchment">{profile.name}</p>
            <p className="mt-1 text-[10.5px] tracking-[0.16em] text-gold/60 uppercase">{race?.name.en}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {profile.titles.map((t) => (
                <span key={t} className="group inline-flex items-center gap-1 border border-gold/35 bg-gold/8 px-2 py-0.5 text-[10px] text-gold-soft">
                  {t}
                  <button type="button" onClick={() => removeTitle(t)} aria-label={`移除称号 ${t}`} className="text-gold/40 hover:text-[#d68b7e]">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>

            <Hairline />
            <div className="space-y-2.5 text-left">
              {[
                { label: '生命', value: profile.health, color: '#9d4a3f', set: (v: number) => updateProfile({ health: v }) },
                { label: '魔法', value: profile.magicka, color: '#4a6f9d', set: (v: number) => updateProfile({ magicka: v }) },
                { label: '耐力', value: profile.stamina, color: '#5d7a45', set: (v: number) => updateProfile({ stamina: v }) },
              ].map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10.5px] text-parchment/45">{s.label}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => s.set(Math.max(50, s.value - 10))} className="text-parchment/30 hover:text-parchment">
                        <Minus size={10} />
                      </button>
                      <span className="w-7 text-center font-display text-[11px] text-parchment/80">{s.value}</span>
                      <button type="button" onClick={() => s.set(Math.min(300, s.value + 10))} className="text-parchment/30 hover:text-parchment">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                  <div className="h-[3px] bg-parchment/10">
                    <div className="h-full transition-all" style={{ width: `${Math.min(100, s.value / 3)}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>

            <Hairline />
            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <p className="eyebrow text-[8px] text-parchment/35">等级</p>
                <div className="mt-1 flex items-center gap-1">
                  <button type="button" onClick={() => updateProfile({ level: Math.max(1, profile.level - 1) })} className="text-parchment/35 hover:text-parchment">
                    <Minus size={11} />
                  </button>
                  <span className="font-display text-[14px] text-parchment">{profile.level}</span>
                  <button type="button" onClick={() => updateProfile({ level: Math.min(81, profile.level + 1) })} className="text-parchment/35 hover:text-parchment">
                    <Plus size={11} />
                  </button>
                </div>
              </div>
              <div>
                <p className="eyebrow text-[8px] text-parchment/35">金币</p>
                <input
                  type="number"
                  value={profile.gold}
                  onChange={(e) => updateProfile({ gold: Math.max(0, Number(e.target.value)) })}
                  className="input mt-1 px-2 py-1 text-[12px]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('这会清除角色档案与所有关联的个人记录，确定要这么做吗？')) {
                  deleteProfile()
                  notify('角色档案已删除。')
                }
              }}
              className="btn btn-sm btn-ghost mt-3 w-full text-[10px] text-[#c98a7e]"
            >
              <Trash2 size={11} /> 删除角色
            </button>
          </div>

          <div className="panel p-4">
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">当前位置</p>
            <Link to="/world" className="flex items-center justify-between gap-2 text-[12px] text-parchment/80 hover:text-gold-soft">
              {cityById[profile.locationId]?.name.zh ?? locationById[profile.locationId]?.name.zh ?? '未知之地'}
              <ArrowRight size={12} className="text-parchment/30" />
            </Link>
            <Hairline />
            <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">称号</p>
            <div className="flex gap-1">
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="新的称号"
                className="input px-2 py-1 text-[11px]"
              />
              <button
                type="button"
                onClick={() => {
                  addTitle(titleInput)
                  setTitleInput('')
                }}
                className="btn btn-sm btn-ghost shrink-0 px-2"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </aside>

        {/* 右：细节 */}
        <div className="min-w-0 space-y-6">
          <section className="panel p-4">
            <SectionHeading eyebrow="Identity" title="角色资料" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="姓名">
                <input value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className="input" />
              </Field>
              <Field label="出身地">
                <input value={profile.origin} onChange={(e) => updateProfile({ origin: e.target.value })} className="input" />
              </Field>
              <Field label="职业倾向">
                <input value={profile.archetype} onChange={(e) => updateProfile({ archetype: e.target.value })} className="input" />
              </Field>
              <Field label="战斗风格">
                <input value={profile.combatStyle} onChange={(e) => updateProfile({ combatStyle: e.target.value })} className="input" />
              </Field>
              <Field label="所属势力">
                <select value={profile.factionId} onChange={(e) => updateProfile({ factionId: e.target.value })} className="select">
                  <option value="">保持独立</option>
                  {joinableFactions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name.zh}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="种族">
                <select value={profile.race} onChange={(e) => updateProfile({ race: e.target.value as RaceId })} className="select">
                  {races.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name.zh}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="背景故事">
                <textarea
                  value={profile.backstory}
                  onChange={(e) => updateProfile({ backstory: e.target.value })}
                  rows={4}
                  className="textarea"
                />
              </Field>
            </div>
            {race && (
              <div className="mt-3 border-t border-gold/12 pt-3">
                <p className="text-[11px] text-parchment/40">
                  <span className="text-gold/60">种族特性 · </span>
                  {race.ability}（主动能力，每日一次）
                </p>
                <p className="mt-1 text-[11px] text-parchment/35">
                  肤色基调 {raceLook[race.id].skin} · 故乡 {race.homeland}
                </p>
              </div>
            )}
          </section>

          {/* 技能 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="Skills" title="技能" sub="18 项原版技能。使用 +/− 调整数值（5–100）。" />
            <div className="space-y-4">
              {skillGroups.map((g) => (
                <div key={g.key}>
                  <p className="mb-2 text-[11px] tracking-[0.16em] text-gold-soft/75">
                    {g.zh} <span className="text-parchment/25">{g.label}</span>
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {skills
                      .filter((s) => s.category === g.key)
                      .map((s) => {
                        const v = profile.skills[s.id] ?? 15
                        return (
                          <div key={s.id} className="border border-parchment/8 px-2.5 py-1.5" title={s.desc}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-[11.5px] text-parchment/75">
                                {s.name.zh}
                                <span className="ml-1 text-[9px] text-parchment/25">{s.name.en}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-1">
                                <button type="button" onClick={() => setSkill(s.id, v - 1)} className="text-parchment/30 hover:text-parchment">
                                  <Minus size={10} />
                                </button>
                                <span className="w-6 text-center font-display text-[11px] text-gold-soft/90">{v}</span>
                                <button type="button" onClick={() => setSkill(s.id, v + 1)} className="text-parchment/30 hover:text-parchment">
                                  <Plus size={10} />
                                </button>
                              </span>
                            </div>
                            <div className="mt-1 h-[2px] bg-parchment/8">
                              <div className="h-full bg-gold/60" style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 装备 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="Equipment" title="装备" sub="从图鉴中选择物品，或直接写入自定义名称。" />
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => {
                const eq = profile.equipment.find((e) => e.slot === slot)
                return (
                  <div key={slot} className="border border-parchment/10 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] tracking-[0.16em] text-gold-soft/70">{equipSlotLabels[slot]}</span>
                      {eq && (
                        <button type="button" onClick={() => setEquipment(slot, null)} aria-label="卸下" className="text-parchment/30 hover:text-[#d68b7e]">
                          <X size={11} />
                        </button>
                      )}
                    </div>
                    <select
                      value={eq?.itemId ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (!v) setEquipment(slot, null)
                        else if (v === '__custom') setEquipment(slot, { customName: '自定义物品' })
                        else setEquipment(slot, { itemId: v })
                      }}
                      className="select px-2 py-1 text-[11.5px]"
                    >
                      <option value="">— 空 —</option>
                      {itemsForSlot(slot).map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name.zh}
                        </option>
                      ))}
                      <option value="__custom">自定义…</option>
                    </select>
                    {eq?.customName !== undefined && (
                      <input
                        value={eq.customName}
                        onChange={(e) => setEquipment(slot, { customName: e.target.value })}
                        placeholder="自定义名称"
                        className="input mt-1.5 px-2 py-1 text-[11px]"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* 龙吼 */}
          <section className="panel p-4">
            <SectionHeading eyebrow="Thu'um" title="龙吼" sub="点击标记你已学会的吼声。" />
            <div className="grid gap-1.5 sm:grid-cols-2">
              {shoutList.map((s) => {
                const known = profile.shouts.includes(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleShout(s.id)}
                    className={cn(
                      'flex items-start gap-2 border p-2.5 text-left transition-colors',
                      known ? 'border-gold/50 bg-gold/8' : 'border-parchment/10 hover:border-parchment/30',
                    )}
                  >
                    <span className={cn('mt-0.5 shrink-0', known ? 'text-gold' : 'text-parchment/20')}>
                      {known ? <Check size={12} /> : <span className="block h-3 w-3 border border-current" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] text-parchment/85">{s.zh}</span>
                      <span className="block text-[9.5px] text-parchment/30">{s.words}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel p-4">
            <SectionHeading eyebrow="Chronicle" title="档案状态" />
            <Prose className="text-[12px]">
              <p>
                创建于 {new Date(profile.createdAt).toLocaleString('zh-CN')}，最后更新于{' '}
                {new Date(profile.updatedAt).toLocaleString('zh-CN')}。
              </p>
              <p>所有修改会自动保存到本机浏览器（IndexedDB）。在「存档与设置」中可导出为 JSON 备份。</p>
            </Prose>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/archive" className="btn btn-sm btn-ghost">
                导出存档
              </Link>
              <Link to="/journal" className="btn btn-sm btn-ghost">
                写日记
              </Link>
              <Link to="/quests" className="btn btn-sm btn-ghost">
                任务日志
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { profile, ready } = usePlayer()
  if (!ready) {
    return <div className="py-20 text-center text-[12px] text-parchment/30">正在读取编年史…</div>
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {profile ? <ProfileView profile={profile} /> : <CreateWizard />}
    </motion.div>
  )
}
