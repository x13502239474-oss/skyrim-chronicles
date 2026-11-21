import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Compass, Feather, Gem, Map, Route, ScrollText, Shield, Sparkles, Users } from 'lucide-react'
import { characters, cities, cityById, holds, placeEntries, quests, solstheim, worldEvents } from '@/data'
import { usePlayer } from '@/store/PlayerContext'
import { Scene } from '@/components/Scene'
import { ShieldSigil } from '@/components/cards'
import { Portrait, portraitFromSeed } from '@/components/Portrait'
import { Badge, Eyebrow, Hairline, RuneDivider, SectionHeading, cn } from '@/components/ui'

const heroPalette = {
  skyTop: '#131c26',
  skyBottom: '#4a4a3c',
  far: '#4d5a62',
  mid: '#2f3a3a',
  near: '#1b2320',
  ground: '#5a5340',
  accent: '#d8b26a',
  kind: 'tundra' as const,
}

export default function Home() {
  const { profile, exploration, questRecords, journal, collection, world } = usePlayer()

  const discovered = Object.values(exploration).filter((r) => r.discovered).length
  const favorited = Object.values(exploration).filter((r) => r.favorited).length
  const activeQuests = Object.values(questRecords).filter((r) => r.status === 'active').length
  const completedQuests = Object.values(questRecords).filter((r) => r.status === 'completed').length
  const ownedItems = Object.values(collection).filter((r) => r.owned).length

  const totalPlaces = placeEntries.length
  const explorePct = Math.round((discovered / totalPlaces) * 100)

  const recentEvents = worldEvents.slice(0, 4)

  return (
    <div className="-mt-4 lg:-mt-8">
      {/* ---------------- 主视觉 ---------------- */}
      <section className="relative -mx-4 flex min-h-[70vh] flex-col justify-end overflow-hidden px-4 pt-10 pb-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:min-h-[86vh] lg:px-12 lg:pb-16">
        <Scene palette={heroPalette} seed={11} />
        <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/55 to-coal/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(11,9,7,0.95),transparent_62%)]" />

        {/* 装饰符线 */}
        <div className="pointer-events-none absolute top-10 right-6 hidden flex-col items-center gap-3 lg:flex" aria-hidden>
          <span className="h-24 w-px bg-gradient-to-b from-transparent to-gold/40" />
          <span className="vertical-text text-[9px] tracking-[0.5em] text-gold/40">第四纪元 · 二〇一年</span>
          <span className="h-24 w-px bg-gradient-to-t from-transparent to-gold/40" />
        </div>

        <div className="relative max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-gold/60" />
              <p className="eyebrow text-[9px] text-gold-soft">The Elder Scrolls · 个人互动编年史</p>
            </div>

            <h1 className="title-xl text-[34px] leading-[1.08] text-parchment sm:text-[46px] lg:text-[58px]">
              CHRONICLES
              <span className="mt-1 block text-gold/90">OF SKYRIM</span>
            </h1>
            <p className="mt-3 font-display text-[15px] tracking-[0.5em] text-parchment/55 sm:text-[17px]">天 际 编 年 史</p>

            <p className="mt-5 max-w-xl text-[13.5px] leading-[2] text-parchment/62">
              龙裔的血脉在雪山之间苏醒。九大领地明争暗斗，古墓下的低语从未止息。
              在这里，你不是在阅读天际省的故事——你是在天际省留下自己的故事。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={profile ? '/world' : '/profile'} className="btn btn-primary">
                <Sparkles size={14} />
                {profile ? '继续冒险' : '开始冒险'}
              </Link>
              <Link to="/world" className="btn btn-ghost">
                <Map size={14} />
                探索天际世界
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-parchment/40">
              <span>{totalPlaces} 处地点</span>
              <span className="text-parchment/15">·</span>
              <span>{quests.length} 项任务</span>
              <span className="text-parchment/15">·</span>
              <span>{cities.length} 座城市</span>
              <span className="text-parchment/15">·</span>
              <span>9 大领地与索瑟姆</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-[1180px] pb-6">
        {/* ---------------- 个人状态 ---------------- */}
        <section className="relative -mt-8 mb-12 px-1">
          <div className="panel corner-frame p-4 sm:p-5">
            {profile ? (
              <>
                <div className="flex flex-wrap items-start gap-4">
                  <Link to="/profile" className="shrink-0">
                    <Portrait spec={portraitFromSeed(profile.avatarSeed, profile.race)} race={profile.race} size={72} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="text-[19px] text-parchment">{profile.name}</h2>
                      <span className="text-[11px] text-gold/70">等级 {profile.level}</span>
                      <span className="text-[11px] text-parchment/40">{profile.titles[0] ?? '冒险者'}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-parchment/45">
                      {profile.archetype} · {profile.combatStyle} · 当前位于 {cityById[profile.locationId]?.name.zh ?? profile.locationId}
                    </p>
                    <div className="mt-3 grid max-w-md grid-cols-3 gap-3">
                      {[
                        { label: '生命', value: profile.health, color: '#9d4a3f' },
                        { label: '魔法', value: profile.magicka, color: '#4a6f9d' },
                        { label: '耐力', value: profile.stamina, color: '#5d7a45' },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="mb-1 flex items-baseline justify-between">
                            <span className="text-[10px] text-parchment/40">{s.label}</span>
                            <span className="font-display text-[11px] text-parchment/70">{s.value}</span>
                          </div>
                          <div className="h-[3px] w-full bg-parchment/10">
                            <motion.div
                              className="h-full"
                              style={{ background: s.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, s.value / 2)}%` }}
                              transition={{ duration: 0.9, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3 border-t border-gold/12 pt-3 sm:w-auto sm:grid-cols-2 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-5">
                    {[
                      { label: '已探索', value: `${discovered}`, hint: `${explorePct}% 全境` },
                      { label: '进行中任务', value: `${activeQuests}`, hint: `已完成 ${completedQuests}` },
                      { label: '收藏地点', value: `${favorited}`, hint: '已标记' },
                      { label: '金币', value: `${profile.gold}`, hint: 'Septim' },
                    ].map((s) => (
                      <div key={s.label} className="min-w-0">
                        <p className="eyebrow text-[8px] text-parchment/35">{s.label}</p>
                        <p className="font-display text-[16px] text-parchment">{s.value}</p>
                        <p className="truncate text-[10px] text-parchment/30">{s.hint}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Hairline />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link to="/world" className="btn btn-sm btn-ghost">
                    <Compass size={12} /> 继续探索
                  </Link>
                  <Link to="/journal" className="btn btn-sm btn-ghost">
                    <Feather size={12} /> 记一笔
                  </Link>
                  <Link to="/quests" className="btn btn-sm btn-ghost">
                    <ScrollText size={12} /> 任务日志
                  </Link>
                  <span className="ml-auto text-[10.5px] text-parchment/30">
                    第四纪元 201 年 · 第 {world.day} 日
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-gold/30 bg-coal/40 text-gold/70">
                  <Sparkles size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] text-parchment">尚未有龙裔踏上这片土地</h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-parchment/50">
                    创建你的角色，天际省的每一条道路、每一个姓名，都将因你的到来而被重新书写。
                  </p>
                </div>
                <Link to="/profile" className="btn btn-primary shrink-0">
                  创建角色 <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ---------------- 九大领地 ---------------- */}
        <section className="mb-12">
          <SectionHeading
            eyebrow="The Nine Holds"
            title="九大领地"
            sub="每一片土地都有自己的领主、气候与旧怨。选择一个方向，开始你的旅程。"
            action={
              <Link to="/holds" className="btn btn-sm btn-ghost">
                全部领地 <ChevronRight size={12} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
            {holds.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: i * 0.03 }}
              >
                <Link
                  to={`/region/${h.id}`}
                  className="group relative flex h-full flex-col justify-between overflow-hidden border border-gold/12 bg-gradient-to-br from-leather/50 to-coal/60 p-3.5 transition-colors hover:border-gold/45"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] tracking-[0.18em] text-parchment/25 uppercase">{h.name.en}</p>
                      <p className="mt-1 text-[14.5px] text-parchment/90 group-hover:text-gold-soft">{h.name.zh}</p>
                    </div>
                    <ShieldSigil sigil={h.sigil} colors={h.banner} size={30} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-parchment/40">{h.tagline}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] text-parchment/30">{cityById[h.capitalId]?.name.zh ?? h.jarlName}</span>
                    <span
                      className={cn(
                        'text-[9.5px] tracking-[0.08em]',
                        h.allegiance === 'imperial' ? 'text-[#c98a7e]' : h.allegiance === 'stormcloak' ? 'text-frost/80' : 'text-parchment/35',
                      )}
                    >
                      {h.allegiance === 'imperial' ? '帝国' : h.allegiance === 'stormcloak' ? '风暴斗篷' : '中立'}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <Link
            to={`/region/${solstheim.id}`}
            className="group mt-2.5 flex items-center gap-4 border border-gold/12 bg-gradient-to-r from-[#1a2028]/80 to-coal/60 p-3.5 transition-colors hover:border-gold/45"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-frost/30 text-frost/70">
              <Compass size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] text-parchment/90 group-hover:text-gold-soft">索瑟姆岛 · Solstheim</span>
              <span className="mt-0.5 block truncate text-[11px] text-parchment/40">
                {solstheim.summary.slice(0, 42)}…
              </span>
            </span>
            <ChevronRight size={14} className="shrink-0 text-parchment/25" />
          </Link>
        </section>

        {/* ---------------- 世界事件 ---------------- */}
        <section className="mb-12">
          <SectionHeading
            eyebrow="Recent Events"
            title="最近的世界事件"
            sub="第四纪元 201 年的天际省，并不安静。"
          />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {recentEvents.map((e) => (
              <article key={e.id} className="border-l-2 border-gold/35 bg-coal/30 py-3 pr-3 pl-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] tracking-[0.14em] text-gold/60">{e.date}</span>
                  <Badge tone={e.kind === 'historical' ? 'muted' : e.kind === 'political' ? 'blood' : e.kind === 'simulated' ? 'frost' : 'gold'}>
                    {e.kind === 'historical' ? '历史' : e.kind === 'political' ? '政治' : e.kind === 'personal' ? '个人' : '模拟'}
                  </Badge>
                </div>
                <h3 className="mt-1.5 text-[13.5px] text-parchment/88">{e.title}</h3>
                <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-parchment/45">{e.desc}</p>
              </article>
            ))}
          </div>

          {world.log.length > 0 && (
            <div className="mt-4 border border-gold/12 bg-coal/20 p-3.5">
              <Eyebrow className="mb-2 text-[8px]">你的足迹</Eyebrow>
              <ul className="space-y-1">
                {world.log.slice(0, 5).map((l) => (
                  <li key={l.id} className="flex items-baseline gap-2 text-[11.5px] text-parchment/50">
                    <span className="text-gold/40">·</span>
                    <span className="min-w-0 truncate">{l.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ---------------- 快捷入口 ---------------- */}
        <section className="mb-4">
          <RuneDivider />
          <SectionHeading eyebrow="Quick Access" title="快捷入口" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { to: '/travel', label: '旅行路线', hint: '规划行程', icon: Route },
              { to: '/quests', label: '任务日志', hint: `${activeQuests} 项进行中`, icon: ScrollText },
              { to: '/characters', label: '人物名册', hint: `${characters.length} 位 NPC`, icon: Users },
              { to: '/factions', label: '势力版图', hint: '内战推演', icon: Shield },
              { to: '/collections', label: '收藏图鉴', hint: `${ownedItems} 件已获得`, icon: Gem },
              { to: '/journal', label: '旅行日记', hint: `${journal.length} 篇记录`, icon: BookOpen },
              { to: '/archive', label: '存档管理', hint: '导出与导入', icon: Feather },
            ].map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group flex flex-col gap-2 border border-gold/12 bg-coal/30 p-3 transition-colors hover:border-gold/45"
              >
                <q.icon size={16} className="text-gold/60 group-hover:text-gold" />
                <span className="text-[12.5px] text-parchment/85">{q.label}</span>
                <span className="text-[10px] text-parchment/30">{q.hint}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
