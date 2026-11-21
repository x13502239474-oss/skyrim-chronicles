import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/* ---------------------------------------------------------------- */
/* 排版                                                              */
/* ---------------------------------------------------------------- */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  action,
  id,
}: {
  eyebrow?: string
  title: string
  sub?: string
  action?: ReactNode
  id?: string
}) {
  return (
    <div id={id} className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h2 className="text-[19px] text-parchment sm:text-[22px]">{title}</h2>
        {sub && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-parchment/55">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function Hairline({ dark = false }: { dark?: boolean }) {
  return <hr className={dark ? 'hairline-dark' : 'hairline'} />
}

export function RuneDivider({ mark = 'ᛟ' }: { mark?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" aria-hidden>
      <span className="hairline flex-1" />
      <span className="text-[11px] tracking-[0.4em] text-gold/45">{mark}</span>
      <span className="hairline flex-1" />
    </div>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('prose-lore text-[14px] leading-[1.95] text-parchment/78', className)}>{children}</div>
}

/* ---------------------------------------------------------------- */
/* 容器                                                              */
/* ---------------------------------------------------------------- */

export function Panel({
  children,
  className,
  corner = false,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  corner?: boolean
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  const Tag = as
  return <Tag className={cn('panel', corner && 'corner-frame', className)}>{children}</Tag>
}

export function Parchment({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('paper grain-paper', className)}>{children}</div>
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="eyebrow mb-1 text-[9px] text-parchment/45">{label}</p>
      <p className={cn('font-display text-[17px] tracking-wide', accent ? 'text-gold' : 'text-parchment')}>{value}</p>
      {hint && <p className="mt-0.5 truncate text-[11px] text-parchment/40">{hint}</p>}
    </div>
  )
}

export function Badge({
  children,
  tone = 'gold',
  className,
}: {
  children: ReactNode
  tone?: 'gold' | 'frost' | 'moss' | 'blood' | 'muted'
  className?: string
}) {
  const tones: Record<string, string> = {
    gold: 'border-gold/40 text-gold-soft bg-gold/8',
    frost: 'border-frost/35 text-frost bg-frost/8',
    moss: 'border-moss/55 text-[#a8bd90] bg-moss/18',
    blood: 'border-blood/60 text-[#d68b7e] bg-blood/18',
    muted: 'border-parchment/20 text-parchment/55 bg-parchment/5',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2 py-[3px] text-[10px] leading-tight tracking-[0.12em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-[3px] w-full bg-parchment/10">
      <motion.div
        className="h-full bg-gradient-to-r from-bronze via-gold to-gold-soft"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* 交互                                                              */
/* ---------------------------------------------------------------- */

export function Chip({
  children,
  active = false,
  onClick,
  title,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 border px-3 py-1.5 text-[11px] tracking-[0.1em] transition-colors',
        active
          ? 'border-gold/70 bg-gold/18 text-gold-soft'
          : 'border-parchment/15 text-parchment/60 hover:border-parchment/35 hover:text-parchment/85',
      )}
    >
      {children}
    </button>
  )
}

export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-bar -mx-1 flex gap-2 overflow-x-auto px-1 py-1', className)}>{children}</div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="no-bar flex gap-1 overflow-x-auto border-b border-gold/15">
      {tabs.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 px-3 py-2.5 text-[12px] tracking-[0.08em] transition-colors',
              active ? 'text-gold-soft' : 'text-parchment/50 hover:text-parchment/80',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-1.5 text-[10px] text-parchment/35">{t.count}</span>
            )}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-1 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export function LinkRow({
  title,
  meta,
  sub,
  right,
  onClick,
  to,
  icon,
}: {
  title: ReactNode
  meta?: ReactNode
  sub?: ReactNode
  right?: ReactNode
  onClick?: () => void
  to?: string
  icon?: ReactNode
}) {
  const inner = (
    <>
      {icon && <span className="mt-0.5 shrink-0 text-gold/60">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[13px] text-parchment/90">{title}</span>
          {meta && <span className="shrink-0 text-[10px] tracking-[0.1em] text-parchment/35">{meta}</span>}
        </span>
        {sub && <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-parchment/45">{sub}</span>}
      </span>
      {right ?? <ChevronRight size={14} className="shrink-0 text-parchment/25" />}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-start gap-3 border-b border-parchment/8 px-1 py-2.5 transition-colors last:border-0 hover:bg-parchment/4"
      >
        {inner}
      </Link>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 border-b border-parchment/8 px-1 py-2.5 text-left transition-colors last:border-0 hover:bg-parchment/4"
    >
      {inner}
    </button>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed border-parchment/15 px-6 py-10 text-center">
      <span className="text-[13px] tracking-[0.2em] text-parchment/45">{title}</span>
      {hint && <p className="max-w-sm text-[12px] leading-relaxed text-parchment/35">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜索…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-parchment/35" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="清除搜索"
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-parchment/40 hover:text-parchment"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-relaxed text-parchment/35">{hint}</span>}
    </label>
  )
}

/* ---------------------------------------------------------------- */
/* 弹层                                                              */
/* ---------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-coal/85 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'panel relative max-h-[88vh] w-full overflow-y-auto',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gold/20 bg-leather/95 px-5 py-3.5 backdrop-blur">
              <h3 className="text-[14px] tracking-[0.12em] text-parchment">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="p-1.5 text-parchment/50 transition-colors hover:text-parchment"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
            {footer && <div className="sticky bottom-0 border-t border-gold/15 bg-leather/95 px-5 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** 手机端底部抽屉 / 桌面端固定侧栏容器 */
export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-coal/70 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="panel fixed inset-x-0 bottom-0 z-[61] max-h-[78vh] overflow-y-auto rounded-t-sm pb-[env(safe-area-inset-bottom)] lg:hidden"
            role="dialog"
            aria-label={title}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/20 bg-leather/95 px-4 py-3 backdrop-blur">
              <span className="text-[11px] tracking-[0.24em] text-gold-soft">{title}</span>
              <button type="button" onClick={onClose} aria-label="收起" className="p-1 text-parchment/60">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ---------------------------------------------------------------- */
/* 折叠区块                                                          */
/* ---------------------------------------------------------------- */

export function Disclosure({
  title,
  meta,
  children,
  defaultOpen = false,
}: {
  title: ReactNode
  meta?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gold/15 bg-coal/25">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate text-[13px] text-parchment/90">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {meta && <span className="text-[10px] tracking-[0.1em] text-parchment/35">{meta}</span>}
          <ChevronRight
            size={14}
            className={cn('text-gold/60 transition-transform', open && 'rotate-90')}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-gold/10 px-4 py-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
