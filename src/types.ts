export type Lang = 'en' | 'zh'

export interface Names {
  en: string
  zh: string
}

export type HoldId =
  | 'whiterun'
  | 'haafingar'
  | 'eastmarch'
  | 'the-rift'
  | 'the-reach'
  | 'falkreath'
  | 'winterhold'
  | 'the-pale'
  | 'hjaalmarch'

export type RegionId = HoldId | 'solstheim'

export type RaceId =
  | 'nord'
  | 'imperial'
  | 'breton'
  | 'redguard'
  | 'altmer'
  | 'bosmer'
  | 'dunmer'
  | 'orsimer'
  | 'khajiit'
  | 'argonian'

export type SkillId =
  | 'smithing'
  | 'heavy-armor'
  | 'block'
  | 'two-handed'
  | 'one-handed'
  | 'archery'
  | 'light-armor'
  | 'sneak'
  | 'lockpicking'
  | 'pickpocket'
  | 'speech'
  | 'alchemy'
  | 'illusion'
  | 'conjuration'
  | 'destruction'
  | 'restoration'
  | 'alteration'
  | 'enchanting'

export type LocationType =
  | 'city'
  | 'town'
  | 'village'
  | 'farm'
  | 'castle'
  | 'fort'
  | 'cave'
  | 'nordic-ruin'
  | 'dwemer-ruin'
  | 'dragon-shrine'
  | 'temple'
  | 'mine'
  | 'shop'
  | 'tavern'
  | 'hall'
  | 'landmark'
  | 'camp'
  | 'dock'
  | 'grove'
  | 'stronghold'
  | 'lighthouse'
  | 'college'
  | 'ruin'

export type Allegiance = 'imperial' | 'stormcloak' | 'neutral'

export interface ScenePalette {
  skyTop: string
  skyBottom: string
  far: string
  mid: string
  near: string
  ground: string
  accent: string
  kind: 'tundra' | 'coast' | 'volcanic' | 'forest' | 'snow' | 'marsh' | 'pine' | 'ash'
}

export interface Hold {
  id: HoldId
  name: Names
  capitalId: string
  jarlName: string
  jarlId: string
  allegiance: Allegiance
  tagline: string
  summary: string
  geography: string[]
  history: string[]
  climate: string
  sigil: string
  banner: [string, string]
  color: string
  labelPos: [number, number]
  polygon: [number, number][]
  characterIds: string[]
  factionIds: string[]
  questIds: string[]
  locationIds: string[]
}

export interface City {
  id: string
  regionId: RegionId
  name: Names
  type: 'city' | 'town'
  summary: string
  history: string[]
  geography: string[]
  politics: string
  population: string
  rulerName: string
  rulerId?: string
  stewardName?: string
  housecarlName?: string
  pos: [number, number]
  palette: ScenePalette
  districtIds: string[]
  characterIds: string[]
  questIds: string[]
  nearbyIds: string[]
  rumors: string[]
  services: { type: string; name: string; keeperId?: string }[]
}

export interface WorldLocation {
  id: string
  name: Names
  type: LocationType
  regionId: RegionId
  cityId?: string
  interior?: boolean
  summary: string
  lore: string[]
  danger: 0 | 1 | 2 | 3 | 4 | 5
  enemies?: string[]
  loot?: string[]
  questIds: string[]
  characterIds: string[]
  factionId?: string
  pos?: [number, number]
  access?: 'public' | 'restricted' | 'hostile'
}

export interface PortraitSpec {
  skin: string
  hair: string
  cloth: string
  hairStyle: number
  beard?: boolean
  eyes?: string
  warpaint?: boolean
  hood?: boolean
}

export interface DialogueLine {
  prompt: string
  reply: string
}

export interface Character {
  id: string
  name: Names
  race: RaceId
  gender: 'male' | 'female'
  role: string
  title: string
  factionIds: string[]
  locationId: string
  regionId: RegionId
  summary: string
  background: string[]
  personality?: string
  questIds: string[]
  services?: string[]
  essential?: boolean
  dialogue: DialogueLine[]
  portrait?: PortraitSpec
}

export type RelationKind =
  | 'family'
  | 'marriage'
  | 'political'
  | 'military'
  | 'friend'
  | 'rival'
  | 'organization'
  | 'mentor'

export interface Relationship {
  id: string
  from: string
  to: string
  kind: RelationKind
  label: string
}

export interface Faction {
  id: string
  name: Names
  type: string
  summary: string
  history: string[]
  goals: string[]
  structure: { rank: string; desc: string }[]
  leaderId: string
  memberIds: string[]
  baseIds: string[]
  questIds: string[]
  allies: string[]
  enemies: string[]
  joinable: boolean
  colors: [string, string]
  glyph: string
}

export type QuestCategory =
  | 'main'
  | 'side'
  | 'imperial'
  | 'stormcloak'
  | 'companions'
  | 'thieves-guild'
  | 'dark-brotherhood'
  | 'college'
  | 'daedric'
  | 'dawnguard'
  | 'dragonborn'

export interface QuestBranchOption {
  label: string
  result: string
  consequence: string
}

export interface QuestBranch {
  id: string
  prompt: string
  options: QuestBranchOption[]
}

export interface Quest {
  id: string
  name: Names
  category: QuestCategory
  summary: string
  description: string
  giverName: string
  giverId?: string
  regionId?: RegionId
  locationIds: string[]
  prerequisite: string
  steps: { title: string; desc: string }[]
  keyCharacterIds: string[]
  rewards: string[]
  factionId?: string
  holdId?: HoldId
  branches?: QuestBranch[]
}

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'magic'
  | 'artifact'
  | 'mask'
  | 'book'
  | 'relic'
  | 'ingredient'
  | 'misc'

export interface Item {
  id: string
  name: Names
  category: ItemCategory
  subtype: string
  summary: string
  effect: string
  obtain: string
  questId?: string
  locationId?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'artifact'
  glyph: string
}

export interface Skill {
  id: SkillId
  name: Names
  category: 'warrior' | 'thief' | 'mage'
  attribute: 'health' | 'magicka' | 'stamina'
  desc: string
}

export interface Race {
  id: RaceId
  name: Names
  summary: string
  bonuses: { skill: SkillId; amount: number }[]
  ability: string
  homeland: string
  accent: string
}

export interface WorldEvent {
  id: string
  date: string
  era: string
  title: string
  desc: string
  kind: 'historical' | 'political' | 'personal' | 'simulated'
}

/* ---------------- player data ---------------- */

export type QuestStatus = 'not-started' | 'active' | 'completed' | 'abandoned'

export type EquipSlot =
  | 'head'
  | 'chest'
  | 'hands'
  | 'feet'
  | 'weapon'
  | 'shield'
  | 'amulet'
  | 'ring'

export interface PlayerProfile {
  id: 'player'
  createdAt: number
  updatedAt: number
  name: string
  race: RaceId
  origin: string
  archetype: string
  combatStyle: string
  backstory: string
  factionId: string
  avatarSeed: number
  level: number
  health: number
  magicka: number
  stamina: number
  gold: number
  skills: Record<SkillId, number>
  equipment: { slot: EquipSlot; itemId?: string; customName?: string }[]
  shouts: string[]
  titles: string[]
  locationId: string
}

export interface ExplorationRecord {
  id: string
  discovered: boolean
  favorited: boolean
  visitedAt?: number
  note?: string
}

export interface QuestRecord {
  id: string
  status: QuestStatus
  stepIndex: number
  choices: Record<string, string>
  updatedAt: number
  note?: string
  /** 玩家自行创建或从真实流程推演出的模拟冒险，与原版任务明确区分 */
  custom?: {
    name: string
    summary: string
    category: QuestCategory
    giverName: string
    regionId?: RegionId
    steps: string[]
  }
}

export interface JournalEntry {
  id: string
  title: string
  body: string
  inWorldDate: string
  locationId?: string
  characterIds: string[]
  questIds: string[]
  tags: string[]
  images: string[]
  createdAt: number
  updatedAt: number
}

export interface CollectionRecord {
  id: string
  owned: boolean
  favorite: boolean
  note?: string
  custom?: {
    name: string
    category: ItemCategory
    subtype: string
    effect: string
    obtain: string
  }
}

export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow' | 'blizzard' | 'fog'

export interface WorldState {
  id: 'world'
  day: number
  hour: number
  weather: Weather
  alignment: Allegiance
  holdControl: Record<HoldId, Allegiance>
  log: { id: string; at: number; text: string }[]
}
