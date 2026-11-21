import { Link } from 'react-router-dom'
import { Check, Flag, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { charactersAtLocation, cityById, dangerLabel, locationById, locationTypeLabels, placeById, questsFor, regionLabel } from '@/data'
import { usePlayer } from '@/store/PlayerContext'
import { Badge, Hairline, cn } from './ui'

export function PlacePanel({ placeId }: { placeId: string }) {
  const place = placeById[placeId]
  const { exploration, discover, unmarkDiscovered, toggleFavorite, setExplorationNote, logEvent, notify } = usePlayer()
  const rec = exploration[placeId]
  const [note, setNote] = useState(rec?.note ?? '')

  useEffect(() => {
    setNote(rec?.note ?? '')
  }, [placeId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!place) {
    return <p className="px-1 py-6 text-[12px] text-parchment/40">未找到该地点。</p>
  }

  const city = place.kind === 'city' ? cityById[place.id] : place.cityId ? cityById[place.cityId] : undefined
  const loc = locationById[place.id]
  const relatedQuests = questsFor(place.kind === 'city' ? (cityById[place.id]?.questIds ?? []) : (loc?.questIds ?? []))
  const people = charactersAtLocation(place.id)

  const onDiscover = () => {
    if (rec?.discovered) {
      unmarkDiscovered(placeId)
      notify(`已撤销「${place.name.zh}」的探索标记。`)
    } else {
      discover(placeId)
      logEvent(`我抵达了${place.name.zh}。`)
      notify(`已记录：抵达${place.name.zh}。`)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[17px] leading-tight text-parchment">{place.name.zh}</h3>
            <p className="mt-1 text-[10px] tracking-[0.18em] text-parchment/30 uppercase">{place.name.en}</p>
          </div>
          {rec?.favorited && <Star size={14} className="shrink-0 text-gold" fill="currentColor" />}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="gold">{place.typeLabel}</Badge>
          <Badge tone="muted">{regionLabel(place.regionId)}</Badge>
          {rec?.discovered && <Badge tone="moss">已探索</Badge>}
        </div>
      </div>

      <p className="text-[12.5px] leading-[1.85] text-parchment/62">{place.summary}</p>

      <div className="grid grid-cols-2 gap-3 border-y border-gold/12 py-3">
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">危险度</p>
          <p className={cn('text-[12.5px]', place.danger >= 4 ? 'text-[#d68b7e]' : place.danger >= 3 ? 'text-gold-soft' : 'text-parchment/75')}>
            {dangerLabel(place.danger)}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-1 text-[8px] text-parchment/35">所属城市</p>
          <p className="truncate text-[12.5px] text-parchment/75">{city ? city.name.zh : place.interior ? '城内地点' : '野外'}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onDiscover} className={cn('btn btn-sm flex-1', rec?.discovered ? 'btn-ghost' : 'btn-primary')}>
          {rec?.discovered ? <Check size={12} /> : <Flag size={12} />}
          {rec?.discovered ? '撤销探索' : '标记已探索'}
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(placeId)}
          aria-label="收藏地点"
          className={cn('btn btn-sm btn-ghost w-11', rec?.favorited && 'text-gold')}
        >
          <Star size={13} fill={rec?.favorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      <Link to={place.kind === 'city' ? `/city/${place.id}` : `/location/${place.id}`} className="btn btn-sm btn-ghost w-full">
        查看完整资料
      </Link>

      {people.length > 0 && (
        <>
          <Hairline />
          <div>
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">此处的人物</p>
            <div className="space-y-1">
              {people.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/characters?focus=${c.id}`}
                  className="flex items-baseline justify-between gap-2 border-b border-parchment/6 py-1.5 last:border-0"
                >
                  <span className="truncate text-[12px] text-parchment/75 hover:text-gold-soft">{c.name.zh}</span>
                  <span className="shrink-0 text-[10px] text-parchment/30">{c.role}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {relatedQuests.length > 0 && (
        <>
          <Hairline />
          <div>
            <p className="eyebrow mb-2 text-[8px] text-parchment/35">相关任务</p>
            <div className="space-y-1">
              {relatedQuests.slice(0, 4).map((q) => (
                <Link key={q.id} to={`/quests?focus=${q.id}`} className="block truncate py-1 text-[12px] text-parchment/70 hover:text-gold-soft">
                  · {q.name.zh}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <Hairline />
      <div>
        <label className="label" htmlFor={`note-${placeId}`}>
          探索笔记
        </label>
        <textarea
          id={`note-${placeId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setExplorationNote(placeId, note)}
          rows={3}
          placeholder="记下你在这里见到的事物…"
          className="textarea text-[12.5px]"
        />
        <p className="mt-1 text-[10px] text-parchment/30">失去焦点时自动保存</p>
      </div>
    </div>
  )
}

export const placeTypeLabel = (t: string) => locationTypeLabels[t]?.zh ?? t
