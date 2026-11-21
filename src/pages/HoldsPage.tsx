import { Link } from 'react-router-dom'
import { Compass, Map } from 'lucide-react'
import { cities, cityById, holds, solstheim, charactersFor } from '@/data'
import { PageHeader } from '@/components/PageHeader'
import { RegionCard, ShieldSigil, CityCard } from '@/components/cards'
import { Badge, Hairline, SectionHeading, cn } from '@/components/ui'
import { usePlayer } from '@/store/PlayerContext'

export default function HoldsPage() {
  const { exploration, world } = usePlayer()

  const progressOf = (ids: string[]) => {
    const total = ids.length
    const done = ids.filter((id) => exploration[id]?.discovered).length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div>
      <PageHeader
        compact
        eyebrow="The Nine Holds"
        title="九大领地"
        en="Holds of Skyrim"
        sub="天际省由九大领地组成，每块领地由一位领主（Jarl）统治，向至高王效忠——或者不效忠。索瑟姆则是亡者之海上的另一段故事。"
        crumbs={[{ to: '/', label: '营地' }, { label: '领地一览' }]}
        actions={
          <Link to="/world" className="btn btn-sm btn-ghost">
            <Map size={12} /> 在地图上查看
          </Link>
        }
        meta={
          <>
            <span>{holds.length} 个领地 + 索瑟姆</span>
            <span>{cities.length} 座城市与城镇</span>
          </>
        }
      />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {holds.map((h) => (
          <RegionCard key={h.id} hold={h} />
        ))}
      </div>

      <Link
        to={`/region/${solstheim.id}`}
        className="group mt-2.5 flex items-center gap-4 border border-gold/12 bg-gradient-to-r from-[#1a2028]/80 to-coal/60 p-4 transition-colors hover:border-gold/45"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-frost/30 text-frost/70">
          <Compass size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-parchment/90 group-hover:text-gold-soft">索瑟姆岛 · Solstheim</span>
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-parchment/40">{solstheim.summary}</span>
        </span>
        <span className="shrink-0 text-[10px] text-parchment/30">{solstheim.locationIds.length} 处地点</span>
      </Link>

      {/* 一览表 */}
      <section className="mt-8">
        <SectionHeading eyebrow="At a Glance" title="领地一览表" sub="领主、首府与当前政治归属。推演后的归属显示在括号内。" />
        <div className="overflow-x-auto border border-gold/12">
          <table className="w-full min-w-[620px] text-left text-[12px]">
            <thead>
              <tr className="border-b border-gold/20 bg-leather/40 text-[10px] tracking-[0.14em] text-parchment/40">
                <th className="px-3 py-2 font-normal">领地</th>
                <th className="px-3 py-2 font-normal">首府</th>
                <th className="px-3 py-2 font-normal">领主</th>
                <th className="px-3 py-2 font-normal">官方立场</th>
                <th className="px-3 py-2 font-normal">我的探索</th>
              </tr>
            </thead>
            <tbody>
              {holds.map((h) => {
                const p = progressOf(h.locationIds)
                const projected = world.holdControl[h.id]
                const capital = cityById[h.capitalId]
                const jarl = charactersFor([h.jarlId])[0]
                return (
                  <tr key={h.id} className="border-b border-parchment/6 last:border-0 hover:bg-parchment/3">
                    <td className="px-3 py-2">
                      <Link to={`/region/${h.id}`} className="flex items-center gap-2 text-parchment/85 hover:text-gold-soft">
                        <ShieldSigil sigil={h.sigil} colors={h.banner} size={18} />
                        {h.name.zh}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {capital ? (
                        <Link to={`/city/${capital.id}`} className="text-parchment/65 hover:text-gold-soft">
                          {capital.name.zh}
                        </Link>
                      ) : (
                        <span className="text-parchment/35">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {jarl ? (
                        <Link to={`/characters?focus=${jarl.id}`} className="text-parchment/65 hover:text-gold-soft">
                          {jarl.name.zh}
                        </Link>
                      ) : (
                        <span className="text-parchment/35">{h.jarlName}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'text-[11px]',
                          h.allegiance === 'imperial' ? 'text-[#c98a7e]' : h.allegiance === 'stormcloak' ? 'text-frost/85' : 'text-parchment/45',
                        )}
                      >
                        {h.allegiance === 'imperial' ? '帝国' : h.allegiance === 'stormcloak' ? '风暴斗篷' : '中立'}
                      </span>
                      {projected !== h.allegiance && (
                        <span className="ml-1 text-[10px] text-gold/60">
                          ({projected === 'imperial' ? '推演：帝国' : projected === 'stormcloak' ? '推演：风暴' : '推演：中立'})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-[11px] text-parchment/60">
                        {p.done}/{p.total}
                      </span>
                      <span className="ml-1.5 text-[10px] text-parchment/30">{p.pct}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-parchment/30">
          官方立场为游戏设定；括号内为你在「势力与政治」页所做的内战推演结果，二者始终分开标注。
        </p>
      </section>

      {/* 城市 */}
      <section className="mt-8">
        <SectionHeading eyebrow="Cities & Towns" title="城市与城镇" sub="十座主要聚居地，各自拥有独立的资料页。" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <CityCard key={c.id} city={c} />
          ))}
        </div>
      </section>

      <Hairline />
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone="muted">九大领地</Badge>
        <Badge tone="muted">索瑟姆</Badge>
        <Badge tone="gold">地图与领地数据独立维护</Badge>
      </div>
    </div>
  )
}
