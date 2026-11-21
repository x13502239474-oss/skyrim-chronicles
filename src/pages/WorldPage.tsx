import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Flag, Layers, MapPin, Star } from 'lucide-react'
import { placeEntries } from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { PlacePanel } from '@/components/PlacePanel'
import { SkyrimMap, regionOptions, typeGroups } from '@/components/SkyrimMap'
import type { ExploreFilter } from '@/components/SkyrimMap'
import { Chip, ChipRow, EmptyState, SearchInput, Sheet, cn } from '@/components/ui'
import { usePlayer } from '@/store/PlayerContext'
import type { RegionId } from '@/types'

export default function WorldPage() {
  const navigate = useNavigate()
  const { exploration } = usePlayer()
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<RegionId | 'all'>('all')
  const [type, setType] = useState('all')
  const [explore, setExplore] = useState<ExploreFilter>('all')
  const [selected, setSelected] = useState<string | undefined>()
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const types = type === 'all' ? null : typeGroups.find((g) => g.id === type)?.types ?? null
    return placeEntries.filter((p) => {
      if (!p.pos) return false
      if (region !== 'all' && p.regionId !== region) return false
      if (types && !types.includes(p.type)) return false
      if (q && !p.name.zh.toLowerCase().includes(q) && !p.name.en.toLowerCase().includes(q)) return false
      const rec = exploration[p.id]
      if (explore === 'discovered' && !rec?.discovered) return false
      if (explore === 'undiscovered' && rec?.discovered) return false
      if (explore === 'favorited' && !rec?.favorited) return false
      return true
    })
  }, [query, region, type, explore, exploration])

  const discoveredCount = Object.values(exploration).filter((r) => r.discovered).length

  const handleSelect = (id: string) => {
    setSelected(id)
    setSheetOpen(true)
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="World Exploration"
        title="天际省地图"
        en="Map of Skyrim"
        sub="拖动与缩放这幅手绘风格的地图，点击任意标记查看地点详情。这张地图依据游戏世界的地理关系绘制，标注与实际方位保持一致。"
        crumbs={[{ to: '/', label: '营地' }, { label: '世界探索' }]}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <MapPin size={11} className="text-gold/60" /> {filtered.length} 处地点可探索
            </span>
            <span className="flex items-center gap-1.5">
              <Flag size={11} className="text-gold/60" /> 已探索 {discoveredCount}
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={11} className="text-gold/60" /> 收藏 {Object.values(exploration).filter((r) => r.favorited).length}
            </span>
          </>
        }
      />

      {/* 筛选 */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={query} onChange={setQuery} placeholder="搜索地点名称…" className="sm:max-w-xs" />
          <div className="no-bar flex gap-1.5 overflow-x-auto">
            {(
              [
                { id: 'all', label: '全部状态' },
                { id: 'discovered', label: '已探索' },
                { id: 'undiscovered', label: '未探索' },
                { id: 'favorited', label: '已收藏' },
              ] as { id: ExploreFilter; label: string }[]
            ).map((o) => (
              <Chip key={o.id} active={explore === o.id} onClick={() => setExplore(o.id)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <ChipRow>
          {regionOptions.map((r) => (
            <Chip key={r.id} active={region === r.id} onClick={() => setRegion(r.id)}>
              {r.label}
            </Chip>
          ))}
        </ChipRow>

        <ChipRow>
          <Chip active={type === 'all'} onClick={() => setType('all')}>
            <Layers size={10} className="mr-1 inline" />
            全部类型
          </Chip>
          {typeGroups.map((g) => (
            <Chip key={g.id} active={type === g.id} onClick={() => setType(g.id)}>
              {g.label}
            </Chip>
          ))}
        </ChipRow>
      </div>

      {/* 地图 + 详情 */}
      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <div className="relative aspect-[1000/760] w-full border border-gold/20 lg:aspect-auto lg:h-[calc(100vh-390px)] lg:min-h-[460px]">
          <SkyrimMap
            selectedId={selected}
            onSelect={handleSelect}
            onHoldSelect={(id) => navigate(`/region/${id}`)}
            regionFilter={region}
            typeFilter={type}
            exploreFilter={explore}
            query={query}
          />
          <div className="pointer-events-none absolute top-3 left-3 hidden sm:block">
            <p className="border border-gold/20 bg-coal/80 px-2 py-1 text-[10px] tracking-[0.1em] text-parchment/50 backdrop-blur">
              点击领地进入领地页 · 滚轮缩放 · 拖动平移
            </p>
          </div>

          {/* 移动端：地点列表触发 */}
          <div className="absolute inset-x-0 bottom-0 border-t border-gold/20 bg-coal/88 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => {
                if (!selected && filtered[0]) setSelected(filtered[0].id)
                setSheetOpen(true)
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="min-w-0 truncate text-[12px] text-parchment/75">
                {selected ? placeEntries.find((p) => p.id === selected)?.name.zh : '查看当前筛选中的地点…'}
              </span>
              <span className="shrink-0 text-[10px] tracking-[0.14em] text-gold/70">详情</span>
            </button>
          </div>
        </div>

        {/* 桌面端详情栏 */}
        <aside className="panel hidden max-h-[calc(100vh-320px)] overflow-y-auto p-4 lg:block">
          {selected ? (
            <PlacePanel placeId={selected} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
              <Compass size={24} className="text-gold/35" />
              <p className="text-[13px] text-parchment/55">在地图上选择一个地点</p>
              <p className="text-[11px] leading-relaxed text-parchment/30">
                点击任意标记，这里会显示它的地理、危险度、相关人物与任务，并可标记为已探索。
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* 移动端地点列表 */}
      <section className="mt-6 lg:hidden">
        <h2 className="mb-2.5 text-[13px] tracking-[0.14em] text-parchment/70">
          筛选结果 <span className="text-parchment/30">{filtered.length}</span>
        </h2>
        {filtered.length === 0 ? (
          <EmptyState title="没有符合条件的地点" hint="尝试更换领地或类型筛选。" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.slice(0, 40).map((p) => {
              const rec = exploration[p.id]
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={cn(
                    'flex items-center justify-between gap-2 border px-3 py-2.5 text-left transition-colors',
                    selected === p.id ? 'border-gold/50 bg-gold/8' : 'border-parchment/12 bg-coal/30',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] text-parchment/85">{p.name.zh}</span>
                    <span className="block truncate text-[10px] text-parchment/30">{p.typeLabel} · {p.name.en}</span>
                  </span>
                  {rec?.discovered ? (
                    <Flag size={11} className="shrink-0 text-gold" />
                  ) : (
                    <span className="shrink-0 text-[9px] text-parchment/25">未探索</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </section>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="地点详情">
        {selected ? <PlacePanel placeId={selected} /> : <p className="text-[12px] text-parchment/40">请选择一个地点。</p>}
      </Sheet>
    </div>
  )
}
