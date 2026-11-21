import Dexie, { type Table } from 'dexie'
import type {
  CollectionRecord,
  ExplorationRecord,
  JournalEntry,
  PlayerProfile,
  QuestRecord,
  WorldState,
} from '@/types'

export class ChronicleDB extends Dexie {
  profile!: Table<PlayerProfile, string>
  exploration!: Table<ExplorationRecord, string>
  quests!: Table<QuestRecord, string>
  journal!: Table<JournalEntry, string>
  collection!: Table<CollectionRecord, string>
  world!: Table<WorldState, string>

  constructor() {
    super('chronicles-of-skyrim')
    this.version(1).stores({
      profile: 'id',
      exploration: 'id',
      quests: 'id',
      journal: 'id',
      collection: 'id',
      world: 'id',
    })
  }
}

export const db = new ChronicleDB()

export interface ExportBundle {
  app: 'chronicles-of-skyrim'
  version: 1
  exportedAt: number
  profile: PlayerProfile | null
  exploration: ExplorationRecord[]
  quests: QuestRecord[]
  journal: JournalEntry[]
  collection: CollectionRecord[]
  world: WorldState | null
}

export async function readAll(): Promise<ExportBundle> {
  const [profile, exploration, quests, journal, collection, world] = await Promise.all([
    db.profile.get('player'),
    db.exploration.toArray(),
    db.quests.toArray(),
    db.journal.toArray(),
    db.collection.toArray(),
    db.world.get('world'),
  ])
  return {
    app: 'chronicles-of-skyrim',
    version: 1,
    exportedAt: Date.now(),
    profile: profile ?? null,
    exploration,
    quests,
    journal,
    collection,
    world: world ?? null,
  }
}

export async function writeAll(bundle: ExportBundle) {
  const tables = [db.profile, db.exploration, db.quests, db.journal, db.collection, db.world]
  await db.transaction('rw', tables, async () => {
    await Promise.all([
      db.profile.clear(),
      db.exploration.clear(),
      db.quests.clear(),
      db.journal.clear(),
      db.collection.clear(),
      db.world.clear(),
    ])
    if (bundle.profile) await db.profile.put(bundle.profile)
    if (bundle.exploration.length) await db.exploration.bulkPut(bundle.exploration)
    if (bundle.quests.length) await db.quests.bulkPut(bundle.quests)
    if (bundle.journal.length) await db.journal.bulkPut(bundle.journal)
    if (bundle.collection.length) await db.collection.bulkPut(bundle.collection)
    if (bundle.world) await db.world.put(bundle.world)
  })
}
