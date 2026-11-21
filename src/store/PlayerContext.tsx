import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { db, readAll } from '@/db'
import type { ExportBundle } from '@/db'
import { holds, skills } from '@/data'
import type {
  Allegiance,
  CollectionRecord,
  ExplorationRecord,
  HoldId,
  ItemCategory,
  JournalEntry,
  PlayerProfile,
  QuestRecord,
  QuestStatus,
  SkillId,
  Weather,
  WorldState,
} from '@/types'

/* ------------------------------------------------------------------ */
/* 默认值                                                              */
/* ------------------------------------------------------------------ */

const emptySkills = () =>
  Object.fromEntries(skills.map((s) => [s.id, 15])) as Record<SkillId, number>

export const defaultWorld = (): WorldState => ({
  id: 'world',
  day: 17,
  hour: 8,
  weather: 'clear',
  alignment: 'neutral',
  holdControl: Object.fromEntries(holds.map((h) => [h.id, h.allegiance])) as Record<HoldId, Allegiance>,
  log: [],
})

export const newProfile = (
  input: Pick<
    PlayerProfile,
    'name' | 'race' | 'origin' | 'archetype' | 'combatStyle' | 'backstory' | 'factionId' | 'avatarSeed'
  >,
): PlayerProfile => {
  const now = Date.now()
  return {
    id: 'player',
    createdAt: now,
    updatedAt: now,
    name: input.name,
    race: input.race,
    origin: input.origin,
    archetype: input.archetype,
    combatStyle: input.combatStyle,
    backstory: input.backstory,
    factionId: input.factionId,
    avatarSeed: input.avatarSeed,
    level: 1,
    health: 100,
    magicka: 100,
    stamina: 100,
    gold: 120,
    skills: emptySkills(),
    equipment: [],
    shouts: [],
    titles: ['龙裔'],
    locationId: 'riverwood',
  }
}

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

export interface Toast {
  id: string
  text: string
}

interface PlayerContextValue {
  ready: boolean
  profile: PlayerProfile | null
  exploration: Record<string, ExplorationRecord>
  questRecords: Record<string, QuestRecord>
  journal: JournalEntry[]
  collection: Record<string, CollectionRecord>
  world: WorldState
  toasts: Toast[]

  notify: (text: string) => void

  createProfile: (input: Parameters<typeof newProfile>[0]) => void
  updateProfile: (patch: Partial<PlayerProfile>) => void
  deleteProfile: () => void
  setSkill: (id: SkillId, value: number) => void
  addTitle: (title: string) => void
  removeTitle: (title: string) => void
  toggleShout: (shout: string) => void
  setEquipment: (slot: string, patch: { itemId?: string; customName?: string } | null) => void

  discover: (placeId: string, extra?: Partial<ExplorationRecord>) => void
  unmarkDiscovered: (placeId: string) => void
  toggleFavorite: (placeId: string) => void
  setExplorationNote: (placeId: string, note: string) => void

  setQuestStatus: (questId: string, status: QuestStatus) => void
  setQuestStep: (questId: string, stepIndex: number) => void
  setQuestChoice: (questId: string, branchId: string, label: string) => void
  setQuestNote: (questId: string, note: string) => void
  addCustomQuest: (data: NonNullable<QuestRecord['custom']>) => string

  addJournal: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateJournal: (id: string, patch: Partial<JournalEntry>) => void
  deleteJournal: (id: string) => void

  toggleOwned: (itemId: string) => void
  toggleCollectFavorite: (itemId: string) => void
  setCollectionNote: (itemId: string, note: string) => void
  addCustomItem: (data: CollectionRecord['custom'] & { name: string }) => void
  removeCollectionRecord: (itemId: string) => void

  advanceHours: (hours: number) => void
  setWeather: (weather: Weather) => void
  setAlignment: (alignment: Allegiance) => void
  setHoldControl: (holdId: HoldId, allegiance: Allegiance) => void
  logEvent: (text: string) => void

  buildBundle: () => ExportBundle
  exportData: () => void
  importData: (text: string) => Promise<boolean>
  resetAll: () => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [exploration, setExploration] = useState<Record<string, ExplorationRecord>>({})
  const [questRecords, setQuestRecords] = useState<Record<string, QuestRecord>>({})
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [collection, setCollection] = useState<Record<string, CollectionRecord>>({})
  const [world, setWorld] = useState<WorldState>(defaultWorld)
  const [toasts, setToasts] = useState<Toast[]>([])

  /* ---------- 初始化：从 IndexedDB 恢复 ---------- */
  useEffect(() => {
    let alive = true
    readAll()
      .then((bundle) => {
        if (!alive) return
        if (bundle.profile) setProfile(bundle.profile)
        setExploration(Object.fromEntries(bundle.exploration.map((r) => [r.id, r])))
        setQuestRecords(Object.fromEntries(bundle.quests.map((r) => [r.id, r])))
        setJournal(bundle.journal.sort((a, b) => b.createdAt - a.createdAt))
        setCollection(Object.fromEntries(bundle.collection.map((r) => [r.id, r])))
        if (bundle.world) setWorld({ ...defaultWorld(), ...bundle.world })
      })
      .catch(() => {
        /* 首次访问或隐私模式下 IndexedDB 不可用时静默降级为内存态 */
      })
      .finally(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [])

  /* ---------- 防抖持久化 ---------- */
  useEffect(() => {
    if (!ready || !profile) return
    const t = setTimeout(() => {
      void db.profile.put({ ...profile, updatedAt: Date.now() })
    }, 300)
    return () => clearTimeout(t)
  }, [ready, profile])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      const rows = Object.values(exploration)
      void db.transaction('rw', db.exploration, async () => {
        await db.exploration.clear()
        if (rows.length) await db.exploration.bulkPut(rows)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [ready, exploration])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      const rows = Object.values(questRecords)
      void db.transaction('rw', db.quests, async () => {
        await db.quests.clear()
        if (rows.length) await db.quests.bulkPut(rows)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [ready, questRecords])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      void db.transaction('rw', db.journal, async () => {
        await db.journal.clear()
        if (journal.length) await db.journal.bulkPut(journal)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [ready, journal])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      const rows = Object.values(collection)
      void db.transaction('rw', db.collection, async () => {
        await db.collection.clear()
        if (rows.length) await db.collection.bulkPut(rows)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [ready, collection])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      void db.world.put(world)
    }, 400)
    return () => clearTimeout(t)
  }, [ready, world])

  /* ---------- 提示 ---------- */
  const notify = useCallback((text: string) => {
    const id = uid()
    setToasts((prev) => [...prev.slice(-2), { id, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800)
  }, [])

  /* ---------- 角色 ---------- */
  const createProfile = useCallback(
    (input: Parameters<typeof newProfile>[0]) => {
      const p = newProfile(input)
      setProfile(p)
      notify(`欢迎来到天际，${p.name}。`)
    },
    [notify],
  )

  const updateProfile = useCallback((patch: Partial<PlayerProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch, updatedAt: Date.now() } : prev))
  }, [])

  const deleteProfile = useCallback(() => {
    setProfile(null)
    void db.profile.clear()
  }, [])

  const setSkill = useCallback((id: SkillId, value: number) => {
    setProfile((prev) =>
      prev ? { ...prev, skills: { ...prev.skills, [id]: Math.max(5, Math.min(100, value)) }, updatedAt: Date.now() } : prev,
    )
  }, [])

  const addTitle = useCallback((title: string) => {
    const t = title.trim()
    if (!t) return
    setProfile((prev) =>
      prev && !prev.titles.includes(t) ? { ...prev, titles: [...prev.titles, t], updatedAt: Date.now() } : prev,
    )
  }, [])

  const removeTitle = useCallback((title: string) => {
    setProfile((prev) =>
      prev ? { ...prev, titles: prev.titles.filter((x) => x !== title), updatedAt: Date.now() } : prev,
    )
  }, [])

  const toggleShout = useCallback((shout: string) => {
    setProfile((prev) => {
      if (!prev) return prev
      const has = prev.shouts.includes(shout)
      return {
        ...prev,
        shouts: has ? prev.shouts.filter((s) => s !== shout) : [...prev.shouts, shout],
        updatedAt: Date.now(),
      }
    })
  }, [])

  const setEquipment = useCallback(
    (slot: string, patch: { itemId?: string; customName?: string } | null) => {
      setProfile((prev) => {
        if (!prev) return prev
        const rest = prev.equipment.filter((e) => e.slot !== slot)
        if (!patch) return { ...prev, equipment: rest, updatedAt: Date.now() }
        return {
          ...prev,
          equipment: [...rest, { slot: slot as PlayerProfile['equipment'][number]['slot'], ...patch }],
          updatedAt: Date.now(),
        }
      })
    },
    [],
  )

  /* ---------- 探索 ---------- */
  const discover = useCallback((placeId: string, extra?: Partial<ExplorationRecord>) => {
    setExploration((prev) => {
      const base: ExplorationRecord = prev[placeId] ?? { id: placeId, discovered: false, favorited: false }
      if (base.discovered && !extra) return prev
      return {
        ...prev,
        [placeId]: { ...base, ...extra, discovered: true, visitedAt: base.visitedAt ?? Date.now() },
      }
    })
  }, [])

  const unmarkDiscovered = useCallback((placeId: string) => {
    setExploration((prev) => {
      const base = prev[placeId]
      if (!base) return prev
      const rest = { ...prev }
      if (!base.favorited && !base.note) {
        delete rest[placeId]
      } else {
        rest[placeId] = { ...base, discovered: false }
      }
      return rest
    })
  }, [])

  const toggleFavorite = useCallback((placeId: string) => {
    setExploration((prev) => {
      const base: ExplorationRecord = prev[placeId] ?? { id: placeId, discovered: false, favorited: false }
      return { ...prev, [placeId]: { ...base, favorited: !base.favorited } }
    })
  }, [])

  const setExplorationNote = useCallback((placeId: string, note: string) => {
    setExploration((prev) => {
      const base: ExplorationRecord = prev[placeId] ?? { id: placeId, discovered: false, favorited: false }
      return { ...prev, [placeId]: { ...base, note } }
    })
  }, [])

  /* ---------- 任务 ---------- */
  const patchQuest = useCallback((questId: string, patch: Partial<QuestRecord>) => {
    setQuestRecords((prev) => {
      const base: QuestRecord = prev[questId] ?? {
        id: questId,
        status: 'not-started',
        stepIndex: 0,
        choices: {},
        updatedAt: Date.now(),
      }
      return { ...prev, [questId]: { ...base, ...patch, updatedAt: Date.now() } }
    })
  }, [])

  const setQuestStatus = useCallback(
    (questId: string, status: QuestStatus) => patchQuest(questId, { status }),
    [patchQuest],
  )
  const setQuestStep = useCallback(
    (questId: string, stepIndex: number) => patchQuest(questId, { stepIndex }),
    [patchQuest],
  )
  const setQuestChoice = useCallback(
    (questId: string, branchId: string, label: string) => {
      setQuestRecords((prev) => {
        const base: QuestRecord = prev[questId] ?? {
          id: questId,
          status: 'active',
          stepIndex: 0,
          choices: {},
          updatedAt: Date.now(),
        }
        return {
          ...prev,
          [questId]: { ...base, status: base.status === 'not-started' ? 'active' : base.status, choices: { ...base.choices, [branchId]: label }, updatedAt: Date.now() },
        }
      })
    },
    [],
  )
  const setQuestNote = useCallback(
    (questId: string, note: string) => patchQuest(questId, { note }),
    [patchQuest],
  )

  const addCustomQuest = useCallback((data: NonNullable<QuestRecord['custom']>) => {
    const id = `custom-quest-${uid()}`
    setQuestRecords((prev) => ({
      ...prev,
      [id]: { id, status: 'active', stepIndex: 0, choices: {}, updatedAt: Date.now(), custom: data },
    }))
    return id
  }, [])

  /* ---------- 日记 ---------- */
  const addJournal = useCallback((entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = uid()
    const now = Date.now()
    setJournal((prev) => [{ ...entry, id, createdAt: now, updatedAt: now }, ...prev])
    return id
  }, [])

  const updateJournal = useCallback((id: string, patch: Partial<JournalEntry>) => {
    setJournal((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e)))
  }, [])

  const deleteJournal = useCallback((id: string) => {
    setJournal((prev) => prev.filter((e) => e.id !== id))
  }, [])

  /* ---------- 收藏 ---------- */
  const patchCollection = useCallback((itemId: string, patch: Partial<CollectionRecord>) => {
    setCollection((prev) => {
      const base: CollectionRecord = prev[itemId] ?? { id: itemId, owned: false, favorite: false }
      return { ...prev, [itemId]: { ...base, ...patch } }
    })
  }, [])

  const toggleOwned = useCallback(
    (itemId: string) => {
      setCollection((prev) => {
        const base: CollectionRecord = prev[itemId] ?? { id: itemId, owned: false, favorite: false }
        return { ...prev, [itemId]: { ...base, owned: !base.owned } }
      })
    },
    [],
  )
  const toggleCollectFavorite = useCallback(
    (itemId: string) => {
      setCollection((prev) => {
        const base: CollectionRecord = prev[itemId] ?? { id: itemId, owned: false, favorite: false }
        return { ...prev, [itemId]: { ...base, favorite: !base.favorite } }
      })
    },
    [],
  )
  const setCollectionNote = useCallback(
    (itemId: string, note: string) => patchCollection(itemId, { note }),
    [patchCollection],
  )
  const addCustomItem = useCallback(
    (data: { name: string; category: ItemCategory; subtype: string; effect: string; obtain: string }) => {
      const id = `custom-${uid()}`
      setCollection((prev) => ({
        ...prev,
        [id]: { id, owned: true, favorite: false, custom: data },
      }))
      notify('已加入自定义收藏品。')
    },
    [notify],
  )
  const removeCollectionRecord = useCallback((itemId: string) => {
    setCollection((prev) => {
      const rest = { ...prev }
      delete rest[itemId]
      return rest
    })
  }, [])

  /* ---------- 世界 ---------- */
  const advanceHours = useCallback((hours: number) => {
    setWorld((prev) => {
      const total = prev.hour + hours
      const dayDelta = Math.floor(total / 24)
      return { ...prev, day: prev.day + dayDelta, hour: ((total % 24) + 24) % 24 }
    })
  }, [])

  const setWeather = useCallback((weather: Weather) => setWorld((prev) => ({ ...prev, weather })), [])
  const setAlignment = useCallback((alignment: Allegiance) => setWorld((prev) => ({ ...prev, alignment })), [])
  const setHoldControl = useCallback((holdId: HoldId, allegiance: Allegiance) => {
    setWorld((prev) => ({ ...prev, holdControl: { ...prev.holdControl, [holdId]: allegiance } }))
  }, [])

  const logEvent = useCallback((text: string) => {
    setWorld((prev) => ({
      ...prev,
      log: [{ id: uid(), at: Date.now(), text }, ...prev.log].slice(0, 60),
    }))
  }, [])

  /* ---------- 导出 / 导入 ---------- */
  const buildBundle = useCallback(
    (): ExportBundle => ({
      app: 'chronicles-of-skyrim',
      version: 1,
      exportedAt: Date.now(),
      profile,
      exploration: Object.values(exploration),
      quests: Object.values(questRecords),
      journal,
      collection: Object.values(collection),
      world,
    }),
    [profile, exploration, questRecords, journal, collection, world],
  )

  const exportData = useCallback(() => {
    const bundle = buildBundle()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skyrim-chronicle-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('编年史已导出为 JSON 文件。')
  }, [buildBundle, notify])

  const importData = useCallback(
    async (text: string) => {
      try {
        const bundle = JSON.parse(text) as ExportBundle
        if (bundle.app !== 'chronicles-of-skyrim') {
          notify('文件不是本编年史的存档。')
          return false
        }
        setProfile(bundle.profile ?? null)
        setExploration(Object.fromEntries((bundle.exploration ?? []).map((r) => [r.id, r])))
        setQuestRecords(Object.fromEntries((bundle.quests ?? []).map((r) => [r.id, r])))
        setJournal((bundle.journal ?? []).sort((a, b) => b.createdAt - a.createdAt))
        setCollection(Object.fromEntries((bundle.collection ?? []).map((r) => [r.id, r])))
        setWorld({ ...defaultWorld(), ...(bundle.world ?? {}) })
        notify('存档已导入。')
        return true
      } catch {
        notify('无法解析该文件，导入失败。')
        return false
      }
    },
    [notify],
  )

  const resetAll = useCallback(async () => {
    await Promise.all([
      db.profile.clear(),
      db.exploration.clear(),
      db.quests.clear(),
      db.journal.clear(),
      db.collection.clear(),
      db.world.clear(),
    ])
    setProfile(null)
    setExploration({})
    setQuestRecords({})
    setJournal([])
    setCollection({})
    setWorld(defaultWorld())
    notify('所有个人记录已清除。')
  }, [notify])

  const value = useMemo<PlayerContextValue>(
    () => ({
      ready,
      profile,
      exploration,
      questRecords,
      journal,
      collection,
      world,
      toasts,
      notify,
      createProfile,
      updateProfile,
      deleteProfile,
      setSkill,
      addTitle,
      removeTitle,
      toggleShout,
      setEquipment,
      discover,
      unmarkDiscovered,
      toggleFavorite,
      setExplorationNote,
      setQuestStatus,
      setQuestStep,
      setQuestChoice,
      setQuestNote,
      addCustomQuest,
      addJournal,
      updateJournal,
      deleteJournal,
      toggleOwned,
      toggleCollectFavorite,
      setCollectionNote,
      addCustomItem,
      removeCollectionRecord,
      advanceHours,
      setWeather,
      setAlignment,
      setHoldControl,
      logEvent,
      buildBundle,
      exportData,
      importData,
      resetAll,
    }),
    [
      ready, profile, exploration, questRecords, journal, collection, world, toasts, notify,
      createProfile, updateProfile, deleteProfile, setSkill, addTitle, removeTitle, toggleShout,
      setEquipment, discover, unmarkDiscovered, toggleFavorite, setExplorationNote,
      setQuestStatus, setQuestStep, setQuestChoice, setQuestNote, addCustomQuest,
      addJournal, updateJournal, deleteJournal,
      toggleOwned, toggleCollectFavorite, setCollectionNote, addCustomItem, removeCollectionRecord,
      advanceHours, setWeather, setAlignment, setHoldControl, logEvent,
      buildBundle, exportData, importData, resetAll,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer 必须在 PlayerProvider 内使用')
  return ctx
}

/** 世界时间格式化：第 N 日 · HH:00 */
export const formatWorldTime = (world: WorldState) => {
  const hh = String(world.hour).padStart(2, '0')
  return `第 ${world.day} 日 · ${hh}:00`
}

export const worldPhase = (hour: number) => {
  if (hour < 5) return '深夜'
  if (hour < 8) return '黎明'
  if (hour < 11) return '清晨'
  if (hour < 14) return '正午'
  if (hour < 17) return '午后'
  if (hour < 20) return '黄昏'
  if (hour < 23) return '夜晚'
  return '深夜'
}
