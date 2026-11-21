import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookMarked, Check, MapPin, Plus, ScrollText, Sparkles, Users } from 'lucide-react'
import {
  charactersFor,
  locationsFor,
  questById,
  questCategories,
  questCategoryName,
  quests,
  regionLabel,
} from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { Badge, Chip, ChipRow, EmptyState, Field, Hairline, Modal, ProgressBar, SearchInput, SectionHeading, Sheet, cn } from '@/components/ui'
import { questStatusLabels, questStatusTone } from '@/lib/labels'
import { usePlayer } from '@/store/PlayerContext'
import type { Quest, QuestCategory, QuestStatus } from '@/types'

const statuses: QuestStatus[] = ['not-started', 'active', 'completed', 'abandoned']

/* ---------------------------------------------------------------- */
/* 原版任务详情                                                      */
/* ---------------------------------------------------------------- */

function QuestDetail({ quest }: { quest: Quest }) {
  const { questRecords, setQuestStatus, setQuestStep, setQuestChoice, setQuestNote, addJournal, notify, logEvent } = usePlayer()
  const rec = questRecords[quest.id]
  const status = rec?.status ?? 'not-started'
  const stepIndex = rec?.stepIndex ?? 0
  const [note, setNote] = useState(rec?.note ?? '')

  useEffect(() => {
    setNote(rec?.note ?? '')
  }, [quest.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const people = charactersFor(quest.keyCharacterIds)
  const places = locationsFor(quest.locationIds)

  const complete = () => {
    setQuestStatus(quest.id, 'completed')
    setQuestStep(quest.id, quest.steps.length)
    logEvent(`我完成了任务「${quest.name.zh}」。`)
    notify('任务已完成，可写入日记。')
  }

  const writeJournal = () => {
    addJournal({
      title: `任务记录：${quest.name.zh}`,
      body: `${quest.summary}\n\n${quest.description}\n\n（记录你在这次冒险中的选择与结果。）`,
      inWorldDate: '第四纪元 201 年',
      locationId: quest.locationIds[0],
      characterIds: quest.keyCharacterIds.slice(0, 3),
      questIds: [quest.id],
      tags: [questCategoryName(quest.category)],
      images: [],
    })
    notify('已生成日记草稿。')
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[19px] leading-tight text-parchment">{quest.name.zh}</h2>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-parchment/30 uppercase">{quest.name.en}</p>
          </div>
          <Badge tone={questStatusTone[status]}>{questStatusLabels[status]}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="gold">{questCategoryName(quest.category)}</Badge>
          <Badge tone="moss">原版任务</Badge>
          {quest.regionId && <Badge tone="muted">{regionLabel(quest.regionId)}</Badge>}
          {quest.factionId && <Badge tone="muted">{quest.factionId}</Badge>}
        </div>
      </div>

      <p className="text-[13px] leading-[1.9] text-parchment/70">{quest.summary}</p>
      <p className="text-[12.5px] leading-[1.95] text-parchment/50">{quest.description}</p>

      <div className="grid grid-cols-2 gap-3 border-y border-gold/12 py-3">
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">发布者</p>
          <p className="truncate text-[12px] text-parchment/78">{quest.giverName}</p>
        </div>
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">前置条件</p>
          <p className="line-clamp-2 text-[12px] leading-snug text-parchment/60">{quest.prerequisite || '无'}</p>
        </div>
      </div>

      {/* 状态 */}
      <div>
        <p className="eyebrow mb-2 text-[8px] text-parchment/35">任务状态</p>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <Chip key={s} active={status === s} onClick={() => setQuestStatus(quest.id, s)}>
              {questStatusLabels[s]}
            </Chip>
          ))}
        </div>
      </div>

      {/* 步骤 */}
      {quest.steps.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow text-[8px] text-parchment/35">任务步骤</p>
            <span className="text-[10px] text-parchment/30">
              {Math.min(stepIndex, quest.steps.length)} / {quest.steps.length}
            </span>
          </div>
          <div className="mb-2">
            <ProgressBar value={Math.min(stepIndex, quest.steps.length)} max={quest.steps.length} />
          </div>
          <ol className="space-y-1">
            {quest.steps.map((st, i) => {
              const done = i < stepIndex
              return (
                <li key={`${st.title}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setQuestStep(quest.id, done ? i : i + 1)}
                    className={cn(
                      'flex w-full items-start gap-2.5 border px-2.5 py-2 text-left transition-colors',
                      done ? 'border-moss/40 bg-moss/10' : 'border-parchment/10 hover:border-parchment/30',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border',
                        done ? 'border-moss/70 bg-moss/50 text-parchment' : 'border-parchment/25 text-transparent',
                      )}
                    >
                      <Check size={9} />
                    </span>
                    <span className="min-w-0">
                      <span className={cn('block text-[12px]', done ? 'text-parchment/55 line-through' : 'text-parchment/85')}>
                        {st.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-parchment/38">{st.desc}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* 分支 */}
      {quest.branches && quest.branches.length > 0 && (
        <div>
          <p className="eyebrow mb-2 text-[8px] text-parchment/35">抉择与后果</p>
          <div className="space-y-3">
            {quest.branches.map((b) => {
              const chosen = rec?.choices[b.id]
              return (
                <div key={b.id} className="border border-gold/15 bg-coal/25 p-3">
                  <p className="text-[12px] text-parchment/80">{b.prompt}</p>
                  <div className="mt-2 space-y-1.5">
                    {b.options.map((o) => {
                      const isChosen = chosen === o.label
                      return (
                        <button
                          key={o.label}
                          type="button"
                          onClick={() => setQuestChoice(quest.id, b.id, o.label)}
                          className={cn(
                            'w-full border px-2.5 py-2 text-left transition-colors',
                            isChosen ? 'border-gold/60 bg-gold/10' : 'border-parchment/10 hover:border-parchment/30',
                          )}
                        >
                          <span className="block text-[12px] text-parchment/85">{o.label}</span>
                          {isChosen && (
                            <span className="mt-1 block text-[11px] leading-relaxed text-gold-soft/75">
                              {o.result}
                              <span className="mt-0.5 block text-parchment/40">后果 · {o.consequence}</span>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 人物与地点 */}
      {people.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 flex items-center gap-1.5 text-[8px] text-parchment/35">
            <Users size={9} /> 关键人物
          </p>
          <div className="flex flex-wrap gap-1.5">
            {people.map((c) => (
              <Link key={c.id} to={`/characters?focus=${c.id}`} className="border border-parchment/12 px-2 py-1 text-[11px] text-parchment/65 hover:border-gold/40 hover:text-gold-soft">
                {c.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}
      {places.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 flex items-center gap-1.5 text-[8px] text-parchment/35">
            <MapPin size={9} /> 相关地点
          </p>
          <div className="flex flex-wrap gap-1.5">
            {places.map((l) => (
              <Link key={l.id} to={`/location/${l.id}`} className="border border-parchment/12 px-2 py-1 text-[11px] text-parchment/65 hover:border-gold/40 hover:text-gold-soft">
                {l.name.zh}
              </Link>
            ))}
          </div>
        </div>
      )}

      {quest.rewards.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5 text-[8px] text-parchment/35">奖励</p>
          <ul className="space-y-1 text-[11.5px] text-parchment/55">
            {quest.rewards.map((r) => (
              <li key={r} className="flex gap-1.5">
                <span className="text-gold/40">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Hairline />

      <div>
        <label className="label" htmlFor={`qnote-${quest.id}`}>
          任务笔记
        </label>
        <textarea
          id={`qnote-${quest.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setQuestNote(quest.id, note)}
          rows={3}
          placeholder="记下你的选择、犹豫与代价…"
          className="textarea text-[12.5px]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={complete} disabled={status === 'completed'} className="btn btn-sm btn-primary">
          <Check size={12} /> 标记完成
        </button>
        <button type="button" onClick={writeJournal} className="btn btn-sm btn-ghost">
          <BookMarked size={12} /> 写入日记
        </button>
        <Link to={`/region/${quest.regionId ?? 'whiterun'}`} className="btn btn-sm btn-ghost">
          所属领地
        </Link>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 自定义冒险详情                                                    */
/* ---------------------------------------------------------------- */

function CustomQuestDetail({ id }: { id: string }) {
  const { questRecords, setQuestStatus, setQuestStep, setQuestNote, notify } = usePlayer()
  const rec = questRecords[id]
  const [note, setNote] = useState(rec?.note ?? '')
  if (!rec?.custom) return null
  const c = rec.custom

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[19px] text-parchment">{c.name}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={questStatusTone[rec.status]}>{questStatusLabels[rec.status]}</Badge>
          <Badge tone="frost">自定义 · 模拟冒险</Badge>
          <Badge tone="gold">{questCategoryName(c.category)}</Badge>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-parchment/30">
          这段冒险由你本人记录，不属于原版游戏任务，仅保存在你的编年史中。
        </p>
      </div>
      <p className="text-[13px] leading-[1.9] text-parchment/70">{c.summary}</p>
      <div className="grid grid-cols-2 gap-3 border-y border-gold/12 py-3">
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">发起者</p>
          <p className="text-[12px] text-parchment/75">{c.giverName || '—'}</p>
        </div>
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">区域</p>
          <p className="text-[12px] text-parchment/75">{c.regionId ? regionLabel(c.regionId) : '未指定'}</p>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-2 text-[8px] text-parchment/35">状态</p>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((s) => (
            <Chip key={s} active={rec.status === s} onClick={() => setQuestStatus(id, s)}>
              {questStatusLabels[s]}
            </Chip>
          ))}
        </div>
      </div>
      {c.steps.length > 0 && (
        <ol className="space-y-1">
          {c.steps.map((st, i) => {
            const done = i < rec.stepIndex
            return (
              <li key={`${st}-${i}`}>
                <button
                  type="button"
                  onClick={() => setQuestStep(id, done ? i : i + 1)}
                  className={cn('flex w-full items-start gap-2.5 border px-2.5 py-2 text-left', done ? 'border-moss/40 bg-moss/10' : 'border-parchment/10')}
                >
                  <span className={cn('mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border', done ? 'border-moss/70 bg-moss/50' : 'border-parchment/25 text-transparent')}>
                    <Check size={9} />
                  </span>
                  <span className={cn('text-[12px]', done ? 'text-parchment/50 line-through' : 'text-parchment/85')}>{st}</span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => {
          setQuestNote(id, note)
          notify('笔记已保存。')
        }}
        rows={3}
        placeholder="记录这次冒险…"
        className="textarea text-[12.5px]"
      />
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 页面                                                              */
/* ---------------------------------------------------------------- */

export default function QuestsPage() {
  const { questRecords, addCustomQuest, notify } = usePlayer()
  const [params] = useSearchParams()
  const focus = params.get('focus')
  const [category, setCategory] = useState<QuestCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string>(focus ?? quests[0].id)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const [form, setForm] = useState({ name: '', summary: '', giver: '', steps: '' })
  const [formCategory, setFormCategory] = useState<QuestCategory>('side')

  useEffect(() => {
    if (focus) {
      setSelected(focus)
      setSheetOpen(true)
    }
  }, [focus])

  const customRecords = Object.values(questRecords).filter((r) => r.custom)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = [
      ...quests.map((x) => ({
        id: x.id,
        name: x.name.zh,
        en: x.name.en,
        category: x.category,
        summary: x.summary,
        original: true,
        status: questRecords[x.id]?.status ?? 'not-started',
      })),
      ...customRecords.map((r) => ({
        id: r.id,
        name: r.custom!.name,
        en: 'Custom',
        category: r.custom!.category,
        summary: r.custom!.summary,
        original: false,
        status: r.status,
      })),
    ]
    return base.filter((x) => {
      if (category !== 'all' && x.category !== category) return false
      if (statusFilter !== 'all' && x.status !== statusFilter) return false
      if (q && !x.name.toLowerCase().includes(q) && !x.summary.toLowerCase().includes(q) && !x.en.toLowerCase().includes(q)) return false
      return true
    })
  }, [category, statusFilter, query, questRecords, customRecords])

  const counts = useMemo(() => {
    const all = Object.values(questRecords)
    return {
      active: all.filter((r) => r.status === 'active').length,
      completed: all.filter((r) => r.status === 'completed').length,
      abandoned: all.filter((r) => r.status === 'abandoned').length,
      touched: all.length,
    }
  }, [questRecords])

  const current = questById[selected]
  const isCustom = !current && Boolean(questRecords[selected]?.custom)

  const detail = current ? <QuestDetail quest={current} /> : isCustom ? <CustomQuestDetail id={selected} /> : (
    <EmptyState title="选择一项任务" hint="从左侧列表中选择任务查看详情。" />
  )

  const submitCustom = () => {
    if (!form.name.trim()) {
      notify('请先填写冒险名称。')
      return
    }
    const id = addCustomQuest({
      name: form.name.trim(),
      summary: form.summary.trim() || '一段由我亲手写下的冒险。',
      category: formCategory,
      giverName: form.giver.trim(),
      steps: form.steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setCreateOpen(false)
    setForm({ name: '', summary: '', giver: '', steps: '' })
    setSelected(id)
    notify('自定义冒险已创建。')
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Quests & Adventures"
        title="任务与冒险"
        en="Quest Log"
        sub="原版任务与你的自定义冒险被明确分开记录。追踪进度、做出抉择，并让每一次后果留在编年史里。"
        crumbs={[{ to: '/', label: '营地' }, { label: '任务与冒险' }]}
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-sm btn-primary">
            <Plus size={12} /> 记录一段冒险
          </button>
        }
        meta={
          <>
            <span>{quests.length} 项原版任务</span>
            <span className="text-gold-soft/80">进行中 {counts.active}</span>
            <span>已完成 {counts.completed}</span>
            <span>已放弃 {counts.abandoned}</span>
          </>
        }
      />

      <div className="mb-3 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索任务名称或内容…" className="sm:max-w-xs" />
          <div className="no-bar flex gap-1.5 overflow-x-auto">
            <Chip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
              全部状态
            </Chip>
            {statuses.map((s) => (
              <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {questStatusLabels[s]}
              </Chip>
            ))}
          </div>
        </div>
        <ChipRow>
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            全部类别
          </Chip>
          {questCategories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {questCategoryName(c)}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
        {/* 列表 */}
        <div className="panel max-h-[70vh] overflow-y-auto p-1.5">
          {list.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-parchment/35">没有符合条件的任务。</p>
          ) : (
            list.map((q) => {
              const active = selected === q.id
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setSelected(q.id)
                    setSheetOpen(true)
                  }}
                  className={cn(
                    'mb-0.5 flex w-full items-start gap-2 border-l-2 px-2.5 py-2 text-left transition-colors',
                    active ? 'border-gold bg-gold/8' : 'border-transparent hover:bg-parchment/4',
                  )}
                >
                  <ScrollText size={12} className={cn('mt-1 shrink-0', active ? 'text-gold' : 'text-parchment/25')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className={cn('truncate text-[12.5px]', active ? 'text-gold-soft' : 'text-parchment/82')}>{q.name}</span>
                      {!q.original && <span className="shrink-0 text-[8.5px] text-frost/70">自定义</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[9.5px] text-parchment/30">{questCategoryName(q.category)}</span>
                      <span className={cn('text-[9.5px]', q.status === 'completed' ? 'text-[#a8bd90]' : q.status === 'active' ? 'text-gold/80' : 'text-parchment/25')}>
                        {questStatusLabels[q.status]}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* 详情 */}
        <div className="panel hidden max-h-[70vh] overflow-y-auto p-4 sm:p-5 lg:block">{detail}</div>
      </div>

      <div className="mt-3 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="btn btn-ghost w-full"
        >
          查看任务详情
        </button>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="任务详情">
        {detail}
      </Sheet>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="记录一段自定义冒险"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn btn-sm btn-ghost">
              取消
            </button>
            <button type="button" onClick={submitCustom} className="btn btn-sm btn-primary">
              创建
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[11.5px] leading-relaxed text-parchment/40">
            这里记录的是<span className="text-gold-soft/80">你自己构想或亲身经历的模拟冒险</span>，不会与原版任务混淆。
          </p>
          <Field label="冒险名称">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="例如：寻找失踪的猎手" />
          </Field>
          <Field label="类别">
            <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as QuestCategory)} className="select">
              {questCategories.map((c) => (
                <option key={c} value={c}>
                  {questCategoryName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="简述">
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={3}
              className="textarea"
              placeholder="发生了什么？你想做什么？"
            />
          </Field>
          <Field label="发起者" hint="可以留空">
            <input value={form.giver} onChange={(e) => setForm({ ...form, giver: e.target.value })} className="input" />
          </Field>
          <Field label="步骤" hint="每行一个步骤">
            <textarea
              value={form.steps}
              onChange={(e) => setForm({ ...form, steps: e.target.value })}
              rows={4}
              className="textarea"
              placeholder={'在河木镇打听消息\n前往 Bleak Falls Barrow\n取回黄金爪'}
            />
          </Field>
        </div>
      </Modal>

      <div className="mt-8">
        <SectionHeading eyebrow="Progress" title="总体进度" />
        <div className="panel p-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[12px] text-parchment/60">
              {counts.touched} 项曾被触碰 · 共 {quests.length + customRecords.length} 项
            </span>
            <span className="font-display text-[14px] text-parchment">
              {Math.round((counts.completed / (quests.length + customRecords.length)) * 100)}%
            </span>
          </div>
          <ProgressBar value={counts.completed} max={quests.length + customRecords.length} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <Badge tone={questStatusTone[s]}>{questStatusLabels[s]}</Badge>
              </span>
            ))}
            <Link to="/journal" className="btn btn-sm btn-ghost ml-auto">
              <Sparkles size={11} /> 把完成的任务写进日记
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
