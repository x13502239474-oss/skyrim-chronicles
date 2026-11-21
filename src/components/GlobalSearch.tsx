import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '@/data'
import type { SearchHit } from '@/data'
import { cn } from './ui'

const kindLabels: Record<SearchHit['kind'], string> = {
  place: '地点',
  character: '人物',
  quest: '任务',
  faction: '势力',
  item: '收藏品',
}

const kindTone: Record<SearchHit['kind'], string> = {
  place: 'text-frost',
  character: 'text-gold-soft',
  quest: 'text-[#c9a9d8]',
  faction: 'text-[#9fb89a]',
  item: 'text-[#d8a98f]',
}

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const hits = useMemo(() => globalSearch(q, 16), [q])

  useEffect(() => {
    if (open) {
      setQ('')
      setCursor(0)
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

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

  const go = (hit: SearchHit) => {
    onClose()
    navigate(hit.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && hits[cursor]) {
      e.preventDefault()
      go(hits[cursor])
    }
  }

  const suggestions = ['白漫城', '战友团', '龙霄宫', '乌弗瑞克', '魔族神器', '冬堡学院']

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[96] flex items-start justify-center px-3 pt-[12vh] sm:pt-[16vh]">
          <motion.div
            className="absolute inset-0 bg-coal/88 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="panel corner-frame relative w-full max-w-xl"
          >
            <div className="flex items-center gap-2.5 border-b border-gold/20 px-4 py-3">
              <Search size={16} className="shrink-0 text-gold/70" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setCursor(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="搜索地点、人物、任务、势力、收藏品…"
                className="flex-1 bg-transparent text-[14px] text-parchment outline-none placeholder:text-parchment/30"
              />
              <button type="button" onClick={onClose} aria-label="关闭搜索" className="p-1 text-parchment/40 hover:text-parchment">
                <X size={15} />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto">
              {!q && (
                <div className="px-4 py-4">
                  <p className="eyebrow mb-2.5 text-[9px] text-parchment/35">试试这些</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQ(s)}
                        className="border border-parchment/15 px-2.5 py-1 text-[11px] text-parchment/60 hover:border-gold/40 hover:text-parchment"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q && hits.length === 0 && (
                <p className="px-4 py-8 text-center text-[12px] text-parchment/40">
                  没有找到「{q}」相关的记载。
                </p>
              )}

              {hits.map((hit, i) => (
                <button
                  key={`${hit.kind}-${hit.id}`}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(hit)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-parchment/6 px-4 py-2.5 text-left last:border-0',
                    i === cursor ? 'bg-gold/10' : 'hover:bg-parchment/4',
                  )}
                >
                  <span className={cn('w-10 shrink-0 text-[10px] tracking-[0.1em]', kindTone[hit.kind])}>
                    {kindLabels[hit.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-parchment/90">{hit.title}</span>
                    <span className="block truncate text-[11px] text-parchment/35">{hit.subtitle}</span>
                  </span>
                  {i === cursor && <CornerDownLeft size={12} className="shrink-0 text-gold/50" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-gold/15 px-4 py-2 text-[10px] text-parchment/30">
              <span>↑↓ 选择 · Enter 前往 · Esc 关闭</span>
              <span>{hits.length} 条结果</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
