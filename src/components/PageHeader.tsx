import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Scene } from './Scene'
import { cn } from './ui'
import type { ScenePalette } from '@/types'

export function PageHeader({
  eyebrow,
  title,
  en,
  sub,
  palette,
  seed = 5,
  crumbs,
  actions,
  meta,
  compact = false,
}: {
  eyebrow?: string
  title: string
  en?: string
  sub?: string
  palette?: ScenePalette
  seed?: number
  crumbs?: { to?: string; label: string }[]
  actions?: ReactNode
  meta?: ReactNode
  compact?: boolean
}) {
  return (
    <header className={cn('relative -mx-4 mb-6 overflow-hidden border-b border-gold/20 sm:-mx-6 lg:-mx-8', compact ? 'mt-0' : '-mt-4 lg:-mt-8')}>
      {palette && (
        <>
          <Scene palette={palette} seed={seed} />
          <div className="absolute inset-0 bg-gradient-to-t from-coal via-coal/78 to-coal/38" />
        </>
      )}
      {!palette && <div className="absolute inset-0 bg-gradient-to-b from-leather/60 to-coal" />}

      <div className={cn('relative px-4 sm:px-6 lg:px-8', compact ? 'py-5' : 'py-8 sm:py-10')}>
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-[10px] tracking-[0.12em] text-parchment/40">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={9} className="text-parchment/20" />}
                {c.to ? (
                  <Link to={c.to} className="transition-colors hover:text-gold-soft">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-parchment/65">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && <p className="eyebrow mb-2 text-[9px]">{eyebrow}</p>}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className={cn('title-xl text-parchment', compact ? 'text-[24px] sm:text-[28px]' : 'text-[28px] sm:text-[38px]')}>
              {title}
            </h1>
            {en && <p className="mt-1.5 font-ui text-[11px] tracking-[0.32em] text-gold/60 uppercase">{en}</p>}
            {sub && <p className="mt-3 max-w-2xl text-[13px] leading-[1.9] text-parchment/62">{sub}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {meta && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-parchment/50">{meta}</div>}
      </div>
    </header>
  )
}
