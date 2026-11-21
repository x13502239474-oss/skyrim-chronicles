import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Gem, Plus, Star } from 'lucide-react'
import { itemById, itemCategoryName, items, questById, locationById } from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { ItemCard } from '@/components/cards'
import {
  Badge,
  Chip,
  ChipRow,
  EmptyState,
  Field,
  Hairline,
  Modal,
  ProgressBar,
  SearchInput,
  SectionHeading,
  cn,
} from '@/components/ui'
import { rarityLabels } from '@/lib/labels'
import { usePlayer } from '@/store/PlayerContext'
import type { Item, ItemCategory } from '@/types'

const categoryOrder: ItemCategory[] = ['weapon', 'armor', 'magic', 'artifact', 'mask', 'book', 'relic', 'ingredient', 'misc']

export default function CollectionsPage() {
  const [params] = useSearchParams()
  const focus = params.get('focus')
  const { collection, toggleOwned, toggleCollectFavorite, setCollectionNote, addCustomItem, notify } = usePlayer()
  const [category, setCategory] = useState<ItemCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [onlyOwned, setOnlyOwned] = useState(false)
  const [detail, setDetail] = useState<string | null>(focus)
  const [createOpen, setCreateOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  const [form, setForm] = useState({ name: '', category: 'weapon' as ItemCategory, subtype: '', effect: '', obtain: '' })

  // 把自定义条目包装成 Item 形状以便统一渲染
  const customItems: Item[] = useMemo(
    () =>
      Object.values(collection)
        .filter((r) => r.custom)
        .map((r) => ({
          id: r.id,
          name: { en: 'Custom Entry', zh: r.custom!.name },
          category: r.custom!.category,
          subtype: r.custom!.subtype || '自定义',
          summary: '由你亲自记录的收藏条目。',
          effect: r.custom!.effect,
          obtain: r.custom!.obtain,
          rarity: 'common',
          glyph: '✦',
        })),
    [collection],
  )

  const all = useMemo(() => [...items, ...customItems], [customItems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((i) => {
      if (category !== 'all' && i.category !== category) return false
      if (onlyOwned && !collection[i.id]?.owned) return false
      if (q && !i.name.zh.toLowerCase().includes(q) && !i.name.en.toLowerCase().includes(q) && !i.effect.includes(q)) return false
      return true
    })
  }, [all, category, onlyOwned, query, collection])

  const ownedCount = all.filter((i) => collection[i.id]?.owned).length
  const favCount = all.filter((i) => collection[i.id]?.favorite).length

  const activeItem = detail ? all.find((i) => i.id === detail) ?? itemById[detail] : undefined
  const activeRec = detail ? collection[detail] : undefined
  const linkedQuest = activeItem?.questId ? questById[activeItem.questId] : undefined
  const linkedPlace = activeItem?.locationId ? locationById[activeItem.locationId] : undefined

  const submit = () => {
    if (!form.name.trim()) {
      notify('请填写收藏品名称。')
      return
    }
    addCustomItem({
      name: form.name.trim(),
      category: form.category,
      subtype: form.subtype.trim() || '自定义',
      effect: form.effect.trim(),
      obtain: form.obtain.trim(),
    })
    setCreateOpen(false)
    setForm({ name: '', category: 'weapon', subtype: '', effect: '', obtain: '' })
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Collections & Discoveries"
        title="收藏与发现"
        en="The Hoard"
        sub="武器、盔甲、魔神器、龙祭司面具与书页。把你在天际找到的一切留在册页之间。"
        crumbs={[{ to: '/', label: '营地' }, { label: '收藏与发现' }]}
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn btn-sm btn-primary">
            <Plus size={12} /> 添加自定义收藏
          </button>
        }
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <Gem size={11} className="text-gold/60" /> {all.length} 件条目
            </span>
            <span>已获得 {ownedCount}</span>
            <span className="flex items-center gap-1.5">
              <Star size={11} className="text-gold/60" /> 收藏 {favCount}
            </span>
          </>
        }
      />

      {/* 总进度 */}
      <div className="panel mb-4 p-4">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[12px] text-parchment/60">图鉴完成度</span>
          <span className="font-display text-[15px] text-parchment">
            {Math.round((ownedCount / Math.max(1, all.length)) * 100)}%
          </span>
        </div>
        <ProgressBar value={ownedCount} max={all.length} />
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {categoryOrder.map((c) => {
            const list = all.filter((i) => i.category === c)
            const own = list.filter((i) => collection[i.id]?.owned).length
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'border px-2 py-1.5 text-left transition-colors',
                  category === c ? 'border-gold/50 bg-gold/8' : 'border-parchment/10 hover:border-parchment/30',
                )}
              >
                <span className="block truncate text-[10px] text-parchment/45">{itemCategoryName(c)}</span>
                <span className="block font-display text-[11px] text-parchment/80">
                  {own}/{list.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 筛选 */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索收藏品或效果…" className="sm:max-w-xs" />
          <div className="flex gap-1.5">
            <Chip active={onlyOwned} onClick={() => setOnlyOwned((v) => !v)}>
              仅看已获得
            </Chip>
            <Chip active={category === 'all'} onClick={() => setCategory('all')}>
              全部分类
            </Chip>
          </div>
        </div>
        <ChipRow>
          {categoryOrder.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {itemCategoryName(c)}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="没有符合条件的收藏品" hint="尝试清除筛选，或添加一件自定义收藏。" />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((i) => (
            <ItemCard
              key={i.id}
              item={i}
              owned={Boolean(collection[i.id]?.owned)}
              favorite={Boolean(collection[i.id]?.favorite)}
              onToggleOwned={() => toggleOwned(i.id)}
              onToggleFavorite={() => toggleCollectFavorite(i.id)}
              onOpen={() => {
                setDetail(i.id)
                setNoteDraft(collection[i.id]?.note ?? '')
              }}
              custom={Boolean(collection[i.id]?.custom)}
            />
          ))}
        </div>
      )}

      {/* 详情 */}
      <Modal open={Boolean(activeItem)} onClose={() => setDetail(null)} title="收藏品详情">
        {activeItem && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[17px] text-parchment">{activeItem.name.zh}</h3>
              <p className="mt-1 text-[10px] tracking-[0.16em] text-parchment/30 uppercase">{activeItem.name.en}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="gold">{itemCategoryName(activeItem.category)}</Badge>
                <Badge tone="muted">{activeItem.subtype}</Badge>
                <Badge tone="frost">{rarityLabels[activeItem.rarity] ?? activeItem.rarity}</Badge>
                {activeRec?.owned && <Badge tone="moss">已获得</Badge>}
                {activeRec?.custom && <Badge tone="frost">自定义</Badge>}
              </div>
            </div>

            <p className="text-[12.5px] leading-[1.9] text-parchment/62">{activeItem.summary}</p>

            <div className="border-y border-gold/12 py-3">
              <p className="eyebrow mb-1 text-[8px] text-parchment/35">效果</p>
              <p className="text-[12.5px] leading-relaxed text-parchment/72">{activeItem.effect || '待补充'}</p>
            </div>

            <div>
              <p className="eyebrow mb-1 text-[8px] text-parchment/35">获取方式</p>
              <p className="text-[12px] leading-relaxed text-parchment/60">{activeItem.obtain || '待补充'}</p>
            </div>

            {(linkedQuest || linkedPlace) && (
              <div className="flex flex-wrap gap-2">
                {linkedQuest && (
                  <Link to={`/quests?focus=${linkedQuest.id}`} className="btn btn-sm btn-ghost">
                    任务 · {linkedQuest.name.zh}
                  </Link>
                )}
                {linkedPlace && (
                  <Link to={`/location/${linkedPlace.id}`} className="btn btn-sm btn-ghost">
                    地点 · {linkedPlace.name.zh}
                  </Link>
                )}
              </div>
            )}

            <Hairline />

            <div>
              <label className="label" htmlFor="collect-note">
                我的笔记
              </label>
              <textarea
                id="collect-note"
                value={noteDraft || (activeRec?.note ?? '')}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                className="textarea text-[12.5px]"
                placeholder="在哪里找到的？当时发生了什么？"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleOwned(activeItem.id)
                }}
                className={cn('btn btn-sm', activeRec?.owned ? 'btn-ghost' : 'btn-primary')}
              >
                {activeRec?.owned ? '标记为未获得' : '标记为已获得'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCollectionNote(activeItem.id, noteDraft)
                  notify('笔记已保存。')
                }}
                className="btn btn-sm btn-ghost"
              >
                保存笔记
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 新建自定义 */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="添加自定义收藏品"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn btn-sm btn-ghost">
              取消
            </button>
            <button type="button" onClick={submit} className="btn btn-sm btn-primary">
              添加
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="名称">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </Field>
          <Field label="分类">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })}
              className="select"
            >
              {categoryOrder.map((c) => (
                <option key={c} value={c}>
                  {itemCategoryName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="子类型">
            <input
              value={form.subtype}
              onChange={(e) => setForm({ ...form, subtype: e.target.value })}
              className="input"
              placeholder="例如：单手剑 / 重甲"
            />
          </Field>
          <Field label="效果">
            <textarea value={form.effect} onChange={(e) => setForm({ ...form, effect: e.target.value })} rows={2} className="textarea" />
          </Field>
          <Field label="获取方式">
            <textarea value={form.obtain} onChange={(e) => setForm({ ...form, obtain: e.target.value })} rows={2} className="textarea" />
          </Field>
        </div>
      </Modal>

      <div className="mt-8">
        <SectionHeading eyebrow="Note" title="说明" />
        <p className="text-[11.5px] leading-relaxed text-parchment/35">
          图鉴中的原版条目均来自游戏内可获得的物品；由你添加的条目会以「自定义」标记，单独保存在本机，不与原版数据混为一谈。
        </p>
      </div>
    </div>
  )
}
