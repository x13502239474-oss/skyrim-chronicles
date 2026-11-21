import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  ChevronRight,
  Cloud,
  CloudRain,
  Compass,
  Feather,
  Gem,
  Home,
  Landmark,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Snowflake,
  ScrollText,
  Sun,
  Route,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { formatWorldTime, usePlayer, worldPhase } from '@/store/PlayerContext'
import { weatherLabels } from '@/data'
import type { Weather } from '@/types'
import { GlobalSearch } from './GlobalSearch'
import { Portrait, portraitFromSeed } from './Portrait'
import { cn } from './ui'

/* ---------------------------------------------------------------- */
/* 导航定义                                                          */
/* ---------------------------------------------------------------- */

export interface NavItem {
  to: string
  label: string
  en: string
  icon: typeof Home
  hint: string
}

export const coreNav: NavItem[] = [
  { to: '/world', label: '世界探索', en: 'World', icon: Compass, hint: '地图、九大领地与地点' },
  { to: '/travel', label: '旅行与路线', en: 'Travel', icon: Route, hint: '规划路线、推进时间与发现' },
  { to: '/profile', label: '冒险者档案', en: 'Profile', icon: UserRound, hint: '角色、技能与装备' },
  { to: '/quests', label: '任务与冒险', en: 'Quests', icon: ScrollText, hint: '任务日志与分支' },
  { to: '/characters', label: '人物与关系', en: 'Characters', icon: Users, hint: 'NPC 与关系网络' },
  { to: '/factions', label: '势力与政治', en: 'Factions', icon: Shield, hint: '九大势力与内战推演' },
  { to: '/collections', label: '收藏与发现', en: 'Collections', icon: Gem, hint: '武器、神器与书籍' },
  { to: '/journal', label: '世界日记', en: 'Journal', icon: BookOpen, hint: '你的天际编年史' },
]

const sideNav: NavItem[] = [
  { to: '/holds', label: '领地一览', en: 'Holds', icon: Landmark, hint: '九大领地索引' },
  { to: '/archive', label: '存档与设置', en: 'Archive', icon: Settings, hint: '导出、导入与重置' },
]

const bottomNav = [
  { to: '/', label: '营地', en: 'Camp', icon: Home },
  { to: '/world', label: '世界', en: 'World', icon: Compass },
  { to: '/quests', label: '任务', en: 'Quests', icon: ScrollText },
  { to: '/journal', label: '日记', en: 'Journal', icon: Feather },
]

/* ---------------------------------------------------------------- */
/* 世界时钟                                                          */
/* ---------------------------------------------------------------- */

const weatherIcon: Record<Weather, typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  blizzard: Snowflake,
  fog: Cloud,
}

function WorldClock({ compact = false }: { compact?: boolean }) {
  const { world, advanceHours, setWeather } = usePlayer()
  const Icon = weatherIcon[world.weather]
  const cycleWeather = () => {
    const order: Weather[] = ['clear', 'cloudy', 'rain', 'snow', 'blizzard', 'fog']
    const next = order[(order.indexOf(world.weather) + 1) % order.length]
    setWeather(next)
  }
  return (
    <div className={cn('panel-soft px-3 py-2.5', compact && 'px-2.5 py-2')}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow text-[8px] text-parchment/40">第四纪元 201 年</p>
          <p className="mt-0.5 truncate font-display text-[12px] tracking-[0.08em] text-parchment/85">
            {formatWorldTime(world)} · {worldPhase(world.hour)}
          </p>
        </div>
        <button
          type="button"
          onClick={cycleWeather}
          title="切换天气"
          className="flex shrink-0 items-center gap-1 border border-gold/25 px-1.5 py-1 text-[10px] text-gold-soft/85 transition-colors hover:border-gold/60"
        >
          <Icon size={11} />
          {!compact && <span>{weatherLabels[world.weather]}</span>}
        </button>
      </div>
      {!compact && (
        <div className="mt-2 flex gap-1">
          <button type="button" onClick={() => advanceHours(1)} className="btn btn-ghost btn-sm flex-1">
            +1 时
          </button>
          <button type="button" onClick={() => advanceHours(8)} className="btn btn-ghost btn-sm flex-1">
            休息 +8 时
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 环境氛围（天气 + 时段）                                            */
/* ---------------------------------------------------------------- */

function Ambience() {
  const { world } = usePlayer()
  const snow = world.weather === 'snow' || world.weather === 'blizzard'
  const rain = world.weather === 'rain'
  const heavy = world.weather === 'blizzard'
  const night = world.hour >= 20 || world.hour < 5
  const dusk = (world.hour >= 17 && world.hour < 20) || (world.hour >= 5 && world.hour < 8)

  const flakes = useMemo(
    () =>
      Array.from({ length: heavy ? 34 : 20 }).map((_, i) => ({
        id: i,
        left: (i * 37) % 100,
        size: 1.5 + ((i * 7) % 5),
        dur: 7 + ((i * 3) % 9),
        delay: -((i * 1.7) % 10),
        op: 0.25 + ((i * 11) % 40) / 100,
      })),
    [heavy],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden" aria-hidden>
      {night && <div className="absolute inset-0 bg-[#06101d] mix-blend-soft-light opacity-60" />}
      {dusk && <div className="absolute inset-0 bg-[#3a1f10] mix-blend-soft-light opacity-35" />}
      {world.weather === 'fog' && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#8a948c]/10 via-[#8a948c]/18 to-[#8a948c]/10" />
      )}
      {rain && (
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(96deg, rgba(200,225,240,0.6) 0 1px, transparent 1px 7px)',
            backgroundSize: '100% 100%',
          }}
        />
      )}
      {snow &&
        flakes.map((f) => (
          <span
            key={f.id}
            className="snowflake"
            style={{
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              opacity: f.op,
              animationDuration: `${f.dur}s`,
              animationDelay: `${f.delay}s`,
            }}
          />
        ))}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 提示条                                                            */
/* ---------------------------------------------------------------- */

function Toaster() {
  const { toasts } = usePlayer()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-[95] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="panel corner-frame max-w-sm px-4 py-2.5 text-center text-[12px] tracking-[0.06em] text-parchment/90"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 布局                                                              */
/* ---------------------------------------------------------------- */

export function Layout({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { pathname } = useLocation()
  const { profile, world } = usePlayer()

  useEffect(() => {
    setMoreOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const activeTop = coreNav.find((n) => pathname.startsWith(n.to))?.to ?? (pathname === '/' ? '/' : '')

  return (
    <div className="min-h-screen bg-coal">
      <Ambience />

      {/* ---------------- 桌面侧栏 ---------------- */}
      <aside className="fixed top-0 bottom-0 left-0 z-40 hidden w-60 flex-col border-r border-gold/15 bg-ink/95 lg:flex">
        <Link to="/" className="block border-b border-gold/15 px-5 py-5">
          <p className="eyebrow text-[8px] text-gold/55">Chronicles of</p>
          <h1 className="mt-1 font-display text-[17px] leading-tight tracking-[0.16em] text-parchment">SKYRIM</h1>
          <p className="mt-1 text-[10px] tracking-[0.3em] text-parchment/40">天际编年史</p>
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="mx-3 mt-3 flex items-center gap-2 border border-parchment/15 px-2.5 py-2 text-left text-[12px] text-parchment/40 transition-colors hover:border-gold/40 hover:text-parchment/70"
        >
          <Search size={13} />
          <span className="flex-1">搜索地点 · 人物 · 任务</span>
          <kbd className="border border-parchment/15 px-1 text-[9px] tracking-wider">⌘K</kbd>
        </button>

        <nav className="no-bar mt-4 flex-1 overflow-y-auto px-2 pb-4">
          {coreNav.map((item) => {
            const active = activeTop === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'group relative flex items-center gap-2.5 px-3 py-2.5 text-[12.5px] tracking-[0.06em] transition-colors',
                  active ? 'text-gold-soft' : 'text-parchment/55 hover:text-parchment/90',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-y-1 left-0 w-[2px] bg-gradient-to-b from-gold/20 via-gold to-gold/20"
                  />
                )}
                <item.icon size={15} className={active ? 'text-gold' : 'text-parchment/35 group-hover:text-gold/70'} />
                <span className="flex-1">{item.label}</span>
                <span className="text-[8px] tracking-[0.2em] text-parchment/20 uppercase">{item.en}</span>
              </NavLink>
            )
          })}

          <div className="mx-3 my-3 hairline" />
          {sideNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 text-[12px] tracking-[0.06em] transition-colors',
                  isActive ? 'text-gold-soft' : 'text-parchment/45 hover:text-parchment/85',
                )
              }
            >
              <item.icon size={14} className="text-parchment/30" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-gold/15 p-3">
          <WorldClock />
          {profile ? (
            <Link to="/profile" className="flex items-center gap-2.5 border border-gold/15 p-2 transition-colors hover:border-gold/40">
              <Portrait spec={portraitFromSeed(profile.avatarSeed, profile.race)} race={profile.race} size={34} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] text-parchment/90">{profile.name}</span>
                <span className="block text-[10px] text-parchment/40">等级 {profile.level} · {profile.gold} 金币</span>
              </span>
              <ChevronRight size={13} className="text-parchment/30" />
            </Link>
          ) : (
            <Link to="/profile" className="btn btn-primary w-full">
              创建角色
            </Link>
          )}
        </div>
      </aside>

      {/* ---------------- 移动顶栏 ---------------- */}
      <header className="sticky top-0 z-50 border-b border-gold/15 bg-ink/92 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link to="/" className="min-w-0 flex-1">
            <p className="font-display text-[13px] leading-none tracking-[0.18em] text-parchment">SKYRIM</p>
            <p className="mt-1 text-[9px] tracking-[0.3em] text-gold/55">天际编年史</p>
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="搜索"
            className="flex h-9 w-9 items-center justify-center border border-parchment/15 text-parchment/60"
          >
            <Search size={15} />
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="全部功能"
            className="flex h-9 w-9 items-center justify-center border border-parchment/15 text-parchment/60"
          >
            <Menu size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto border-t border-gold/10 px-3 py-1.5 no-bar">
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-parchment/40">
            <Sun size={10} className="text-gold/60" />
            {formatWorldTime(world)}
          </span>
          <span className="shrink-0 text-[10px] text-parchment/25">·</span>
          <span className="shrink-0 text-[10px] text-parchment/40">{weatherLabels[world.weather]}</span>
          {profile && (
            <>
              <span className="shrink-0 text-[10px] text-parchment/25">·</span>
              <span className="shrink-0 truncate text-[10px] text-parchment/40">
                {profile.name} · 等级 {profile.level}
              </span>
            </>
          )}
        </div>
      </header>

      {/* ---------------- 主内容 ---------------- */}
      <main className="lg:pl-60">
        <div className="mx-auto min-h-screen w-full max-w-[1280px] px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-16">
          {children}
        </div>
        <footer className="border-t border-gold/10 px-4 py-6 text-center lg:pl-60">
          <p className="text-[10px] leading-relaxed tracking-[0.14em] text-parchment/25">
            天际编年史 · 个人互动 RPG 探索平台
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-[10px] leading-relaxed text-parchment/20">
            本站为《The Elder Scrolls V: Skyrim》的爱好者向二创作品，世界观与角色版权归 Bethesda Softworks 所有。
            标注「模拟」的内容为方便游玩所作的合理推演，不代表官方设定。
          </p>
        </footer>
      </main>

      {/* ---------------- 移动底部导航 ---------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/20 bg-ink/96 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5">
          {bottomNav.map((item) => {
            const active = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 transition-colors',
                  active ? 'text-gold-soft' : 'text-parchment/45',
                )}
              >
                <item.icon size={17} />
                <span className="text-[10px] tracking-[0.1em]">{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2.5 transition-colors',
              moreOpen ? 'text-gold-soft' : 'text-parchment/45',
            )}
          >
            <MoreHorizontal size={17} />
            <span className="text-[10px] tracking-[0.1em]">更多</span>
          </button>
        </div>
      </nav>

      {/* ---------------- 移动全部功能 ---------------- */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-coal/80 backdrop-blur-sm lg:hidden"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              className="panel fixed inset-x-0 bottom-0 z-[81] max-h-[86vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
              <div className="sticky top-0 flex items-center justify-between border-b border-gold/20 bg-leather/95 px-4 py-3 backdrop-blur">
                <span className="text-[11px] tracking-[0.24em] text-gold-soft">全部功能</span>
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="关闭" className="p-1 text-parchment/60">
                  <X size={16} />
                </button>
              </div>
              <div className="px-4 py-4">
                <WorldClock />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[...coreNav, ...sideNav].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-start gap-2.5 border border-gold/15 bg-coal/30 p-3 transition-colors active:border-gold/40"
                    >
                      <item.icon size={16} className="mt-0.5 shrink-0 text-gold/70" />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] text-parchment/90">{item.label}</span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-parchment/35">{item.hint}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4">
                  {profile ? (
                    <Link to="/profile" className="flex items-center gap-3 border border-gold/20 p-3">
                      <Portrait spec={portraitFromSeed(profile.avatarSeed, profile.race)} race={profile.race} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-parchment">{profile.name}</span>
                        <span className="block text-[10px] text-parchment/40">
                          等级 {profile.level} · {profile.titles[0] ?? '冒险者'}
                        </span>
                      </span>
                      <ChevronRight size={14} className="text-parchment/30" />
                    </Link>
                  ) : (
                    <Link to="/profile" className="btn btn-primary w-full">
                      创建你的角色
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster />
    </div>
  )
}
