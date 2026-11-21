import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ImagePlus, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { characterById, cityById, items, locationById, locations, questById, quests } from '@/data'
import { PageHeader } from '@/components/PageHeader'
import {
  Badge,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  Hairline,
  Modal,
  Parchment,
  SearchInput,
  SectionHeading,
} from '@/components/ui'
import { formatDateTime } from '@/lib/labels'
import { usePlayer } from '@/store/PlayerContext'
import type { JournalEntry } from '@/types'

const blank = (): Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  body: '',
  inWorldDate: '第四纪元 201 年',
  locationId: undefined,
  characterIds: [],
  questIds: [],
  tags: [],
  images: [],
})

/** 压缩图片，避免 IndexedDB 被原图撑爆 */
const readImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 900
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(String(reader.result))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.onerror = () => reject(new Error('图片无法读取'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })

export default function JournalPage() {
  const {
    journal,
    profile,
    questRecords,
    exploration,
    collection,
    addJournal,
    updateJournal,
    deleteJournal,
    notify,
  } = usePlayer()

  const [editing, setEditing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(blank())
  const [tagInput, setTagInput] = useState('')
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('全部')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const allTags = useMemo(() => ['全部', ...Array.from(new Set(journal.flatMap((e) => e.tags)))], [journal])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return journal.filter((e) => {
      if (tagFilter !== '全部' && !e.tags.includes(tagFilter)) return false
      if (q && !e.title.toLowerCase().includes(q) && !e.body.toLowerCase().includes(q)) return false
      return true
    })
  }, [journal, query, tagFilter])

  const startNew = () => {
    setEditing(null)
    setDraft(blank())
    setOpen(true)
  }

  const startEdit = (e: JournalEntry) => {
    setEditing(e.id)
    setDraft({
      title: e.title,
      body: e.body,
      inWorldDate: e.inWorldDate,
      locationId: e.locationId,
      characterIds: e.characterIds,
      questIds: e.questIds,
      tags: e.tags,
      images: e.images,
    })
    setOpen(true)
  }

  const save = () => {
    if (!draft.title.trim() && !draft.body.trim()) {
      notify('至少写下一个标题或一段文字。')
      return
    }
    if (editing) {
      updateJournal(editing, draft)
      notify('日记已更新。')
    } else {
      addJournal({ ...draft, title: draft.title.trim() || '未命名的记录' })
      notify('新的日记已写入编年史。')
    }
    setOpen(false)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    setDraft((d) => (d.tags.includes(t) ? d : { ...d, tags: [...d.tags, t] }))
    setTagInput('')
  }

  const onPickImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      const imgs = await Promise.all(Array.from(files).slice(0, 3).map(readImage))
      setDraft((d) => ({ ...d, images: [...d.images, ...imgs].slice(0, 6) }))
    } catch {
      notify('图片读取失败。')
    }
  }

  /* ---------- 草稿生成 ---------- */
  const draftsFromQuests = () => {
    const done = quests.filter((q) => questRecords[q.id]?.status === 'completed').slice(0, 5)
    if (done.length === 0) {
      notify('还没有已完成的任务可以生成草稿。')
      return
    }
    done.forEach((q) =>
      addJournal({
        title: `任务完成：${q.name.zh}`,
        body: `${q.summary}\n\n我在这次冒险中完成了它。${q.rewards.length ? `所得：${q.rewards.join('、')}。` : ''}\n\n（继续补充细节…）`,
        inWorldDate: '第四纪元 201 年',
        locationId: q.locationIds[0],
        characterIds: q.keyCharacterIds.slice(0, 3),
        questIds: [q.id],
        tags: ['任务'],
        images: [],
      }),
    )
    notify(`已根据 ${done.length} 项已完成任务生成草稿。`)
  }

  const draftsFromPlaces = () => {
    const visited = Object.values(exploration)
      .filter((r) => r.discovered)
      .slice(-5)
      .map((r) => locationById[r.id])
      .filter(Boolean)
    if (visited.length === 0) {
      notify('还没有已探索的地点。')
      return
    }
    visited.forEach((l) =>
      addJournal({
        title: `抵达${l.name.zh}`,
        body: `${l.summary}\n\n${l.lore[0] ?? ''}\n\n（记录你看到、听到、闻到的一切…）`,
        inWorldDate: '第四纪元 201 年',
        locationId: l.id,
        characterIds: [],
        questIds: l.questIds.slice(0, 2),
        tags: ['旅途'],
        images: [],
      }),
    )
    notify('已根据最近探索的地点生成草稿。')
  }

  const draftsFromItems = () => {
    const owned = Object.values(collection).filter((r) => r.owned).slice(-5)
    if (owned.length === 0) {
      notify('收藏册中还没有已获得的物品。')
      return
    }
    owned.forEach((r) => {
      const name = r.custom?.name ?? items.find((i) => i.id === r.id)?.name.zh ?? '未知物品'
      addJournal({
        title: `所得：${name}`,
        body: `我得到了${name}。\n\n（它是从谁手中、哪座墓穴、哪场交易里来的？）`,
        inWorldDate: '第四纪元 201 年',
        characterIds: [],
        questIds: [],
        tags: ['收获'],
        images: [],
      })
    })
    notify('已根据最近获得的收藏生成草稿。')
  }

  const exportJournal = () => {
    if (journal.length === 0) {
      notify('还没有可以导出的日记。')
      return
    }
    const text = journal
      .map((e) => {
        const meta = [
          e.inWorldDate,
          e.locationId ? locationById[e.locationId]?.name.zh ?? cityById[e.locationId]?.name.zh : '',
          e.tags.join(' / '),
        ]
          .filter(Boolean)
          .join(' · ')
        return `# ${e.title}\n\n> ${meta}\n\n${e.body}\n`
      })
      .join('\n---\n\n')
    const blob = new Blob([`# ${profile?.name ?? '无名龙裔'} 的天际编年史\n\n${text}`], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'skyrim-journal.md'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('日记已导出为 Markdown。')
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Journal & Chronicles"
        title="世界日记"
        en="Journal"
        sub="以羊皮纸记下你在天际的每一天。你可以从已完成的任务、到过的地方与获得的物品一键生成草稿，再慢慢写成自己的故事。"
        crumbs={[{ to: '/', label: '营地' }, { label: '世界日记' }]}
        actions={
          <button type="button" onClick={startNew} className="btn btn-sm btn-primary">
            <Plus size={12} /> 新建日记
          </button>
        }
        meta={
          <>
            <span>{journal.length} 篇记录</span>
            <span>{allTags.length - 1} 个标签</span>
            <span>{journal.reduce((n, e) => n + e.images.length, 0)} 张插图</span>
          </>
        }
      />

      {/* 工具栏 */}
      <div className="mb-4 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索日记标题或内容…" className="sm:max-w-xs" />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={draftsFromQuests} className="btn btn-sm btn-ghost">
              <Sparkles size={11} /> 由任务生成
            </button>
            <button type="button" onClick={draftsFromPlaces} className="btn btn-sm btn-ghost">
              由地点生成
            </button>
            <button type="button" onClick={draftsFromItems} className="btn btn-sm btn-ghost">
              由收藏生成
            </button>
            <button type="button" onClick={exportJournal} className="btn btn-sm btn-ghost">
              <Download size={11} /> 导出
            </button>
          </div>
        </div>
        {allTags.length > 1 && (
          <ChipRow>
            {allTags.map((t) => (
              <Chip key={t} active={tagFilter === t} onClick={() => setTagFilter(t)}>
                {t}
              </Chip>
            ))}
          </ChipRow>
        )}
      </div>

      {/* 列表 */}
      {list.length === 0 ? (
        <EmptyState
          title="编年史还是空白的"
          hint="写第一篇日记，或让系统根据你的冒险生成草稿。"
          action={
            <button type="button" onClick={startNew} className="btn btn-sm btn-primary">
              <Plus size={11} /> 新建日记
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((e) => {
            const place = e.locationId ? locationById[e.locationId] ?? cityById[e.locationId] : undefined
            return (
              <Parchment key={e.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] leading-snug text-[#2a2015]">{e.title}</h3>
                    <p className="mt-1 text-[10px] tracking-[0.1em] text-[#7a6544]">
                      {e.inWorldDate}
                      {place ? ` · ${place.name.zh}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(e)}
                      aria-label="编辑"
                      className="p-1.5 text-[#7a6544] transition-colors hover:text-[#2a2015]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(e.id)}
                      aria-label="删除"
                      className="p-1.5 text-[#8a6a4a] transition-colors hover:text-[#7c2f26]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {e.images.length > 0 && (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto no-bar">
                    {e.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="h-20 w-28 shrink-0 border border-[#b6a075] object-cover" />
                    ))}
                  </div>
                )}

                <p className="mt-2 line-clamp-6 flex-1 text-[12.5px] leading-[1.9] whitespace-pre-wrap text-[#3a2d1c]">{e.body}</p>

                {e.tags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span key={t} className="border border-[#a8905f] px-1.5 py-[1px] text-[9.5px] text-[#6b5433]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {(e.characterIds.length > 0 || e.questIds.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-[#c6b28a] pt-2">
                    {e.characterIds.map((id) => {
                      const c = characterById[id]
                      return c ? (
                        <Link
                          key={id}
                          to={`/characters?focus=${id}`}
                          className="text-[10px] text-[#6b5433] underline decoration-dotted underline-offset-2 hover:text-[#2a2015]"
                        >
                          {c.name.zh}
                        </Link>
                      ) : null
                    })}
                    {e.questIds.map((id) => {
                      const q = questById[id]
                      return q ? (
                        <Link
                          key={id}
                          to={`/quests?focus=${id}`}
                          className="text-[10px] text-[#6b5433] underline decoration-dotted underline-offset-2 hover:text-[#2a2015]"
                        >
                          {q.name.zh}
                        </Link>
                      ) : null
                    })}
                  </div>
                )}

                <p className="mt-2 text-[9px] text-[#8a7a58]">最后编辑 · {formatDateTime(e.updatedAt)}</p>
              </Parchment>
            )
          })}
        </div>
      )}

      {/* 编辑器 */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? '编辑日记' : '新建日记'}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-sm btn-ghost">
              取消
            </button>
            <button type="button" onClick={save} className="btn btn-sm btn-primary">
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="标题">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" placeholder="例如：白漫城的第一场雪" />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="世界内日期">
              <input
                value={draft.inWorldDate}
                onChange={(e) => setDraft({ ...draft, inWorldDate: e.target.value })}
                className="input"
                placeholder="第四纪元 201 年 · 末种月"
              />
            </Field>
            <Field label="地点">
              <select
                value={draft.locationId ?? ''}
                onChange={(e) => setDraft({ ...draft, locationId: e.target.value || undefined })}
                className="select"
              >
                <option value="">不指定</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name.zh}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="正文">
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={8}
              className="textarea"
              placeholder={'雪落在龙霄宫的屋檐上。守卫问我从哪里来，我说，从南方。\n\n他没有再问。'}
            />
          </Field>

          {/* 关联人物 */}
          <div>
            <p className="label">关联人物</p>
            <select
              className="select"
              value=""
              onChange={(e) => {
                const id = e.target.value
                if (!id) return
                setDraft((d) => (d.characterIds.includes(id) ? d : { ...d, characterIds: [...d.characterIds, id] }))
              }}
            >
              <option value="">添加人物…</option>
              {Object.values(characterById)
                .slice(0, 300)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.zh} · {c.role}
                  </option>
                ))}
            </select>
            {draft.characterIds.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {draft.characterIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 border border-gold/30 px-1.5 py-0.5 text-[10px] text-parchment/70">
                    {characterById[id]?.name.zh ?? id}
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, characterIds: d.characterIds.filter((x) => x !== id) }))}
                      aria-label="移除"
                      className="text-parchment/30 hover:text-[#d68b7e]"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 关联任务 */}
          <div>
            <p className="label">关联任务</p>
            <select
              className="select"
              value=""
              onChange={(e) => {
                const id = e.target.value
                if (!id) return
                setDraft((d) => (d.questIds.includes(id) ? d : { ...d, questIds: [...d.questIds, id] }))
              }}
            >
              <option value="">添加任务…</option>
              {quests.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name.zh}
                </option>
              ))}
            </select>
            {draft.questIds.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {draft.questIds.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 border border-gold/30 px-1.5 py-0.5 text-[10px] text-parchment/70">
                    {questById[id]?.name.zh ?? id}
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, questIds: d.questIds.filter((x) => x !== id) }))}
                      aria-label="移除"
                      className="text-parchment/30 hover:text-[#d68b7e]"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 标签 */}
          <div>
            <p className="label">标签</p>
            <div className="flex gap-1.5">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="输入后按 Enter"
                className="input"
              />
              <button type="button" onClick={addTag} className="btn btn-sm btn-ghost shrink-0">
                <Plus size={11} />
              </button>
            </div>
            {draft.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {draft.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 border border-gold/30 px-1.5 py-0.5 text-[10px] text-parchment/70">
                    {t}
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))}
                      aria-label="移除"
                      className="text-parchment/30 hover:text-[#d68b7e]"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 图片 */}
          <div>
            <p className="label">插图</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-sm btn-ghost">
                <ImagePlus size={11} /> 添加图片
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void onPickImages(e.target.files)}
              />
              <span className="text-[10px] text-parchment/30">最多 6 张，会自动压缩</span>
            </div>
            {draft.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-16 w-24 border border-gold/25 object-cover" />
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, images: d.images.filter((_, x) => x !== i) }))}
                      aria-label="移除图片"
                      className="absolute top-0 right-0 bg-coal/80 p-0.5 text-parchment/70"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 删除确认 */}
      <Modal
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        title="删除这篇日记？"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmId(null)} className="btn btn-sm btn-ghost">
              保留
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirmId) deleteJournal(confirmId)
                setConfirmId(null)
                notify('日记已删除。')
              }}
              className="btn btn-sm btn-primary"
            >
              删除
            </button>
          </div>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-parchment/55">
          这段记录会从编年史与本机存储中一并移除，无法撤销。若它对你很重要，建议先导出备份。
        </p>
        <Hairline />
        <button type="button" onClick={exportJournal} className="btn btn-sm btn-ghost">
          <Download size={11} /> 先导出全部日记
        </button>
      </Modal>

      <div className="mt-8">
        <SectionHeading eyebrow="How it works" title="日记如何运作" />
        <ul className="space-y-1.5 text-[11.5px] leading-relaxed text-parchment/40">
          <li className="flex gap-2">
            <Badge tone="gold">1</Badge> 日记保存在本机 IndexedDB，刷新或关闭浏览器都不会丢失。
          </li>
          <li className="flex gap-2">
            <Badge tone="gold">2</Badge> 「由任务/地点/收藏生成」会各生成若干篇草稿，可在编辑器中继续改写。
          </li>
          <li className="flex gap-2">
            <Badge tone="gold">3</Badge> 图片会自动压缩到 900px 以内，避免占用过多存储空间。
          </li>
          <li className="flex gap-2">
            <Badge tone="gold">4</Badge> 建议定期在「存档与设置」中导出 JSON，做一份完整备份。
          </li>
        </ul>
      </div>
    </div>
  )
}
