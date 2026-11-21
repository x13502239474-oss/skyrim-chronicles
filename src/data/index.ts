import type {
  Character,
  City,
  Faction,
  HoldId,
  Item,
  Quest,
  QuestCategory,
  RegionId,
  Relationship,
  WorldLocation,
} from '@/types'
import { cities } from './cities'
import { holds, holdById, solstheim } from './regions'
import { interiorLocations } from './locations-interior-a'
import { interiorLocationsB } from './locations-interior-b'
import { interiorLocationsC } from './locations-interior-c'
import { interiorLocationsD } from './locations-interior-d'
import { wildLocationsA } from './locations-wild-a'
import { wildLocationsB } from './locations-wild-b'
import { wildLocationsC } from './locations-wild-c'
import { charactersA } from './characters-a'
import { charactersB } from './characters-b'
import { charactersC } from './characters-c'
import { charactersD } from './characters-d'
import { factions } from './factions'
import { quests, questCategoryLabels } from './quests'
import { items, itemCategoryLabels } from './items'
import { relationships } from './relationships'
import { races, skills, shoutList, skillGroups } from './races'
import { worldEvents } from './events'

export { cities, holds, holdById, solstheim, factions, quests, items, relationships, races, skills, shoutList, skillGroups, worldEvents }
export { months, weatherLabels } from './events'
export { questCategoryLabels, itemCategoryLabels }

export const locations: WorldLocation[] = [
  ...interiorLocations,
  ...interiorLocationsB,
  ...interiorLocationsC,
  ...interiorLocationsD,
  ...wildLocationsA,
  ...wildLocationsB,
  ...wildLocationsC,
]

export const characters: Character[] = [...charactersA, ...charactersB, ...charactersC, ...charactersD]

export const characterById = Object.fromEntries(characters.map((c) => [c.id, c])) as Record<string, Character>
export const locationById = Object.fromEntries(locations.map((l) => [l.id, l])) as Record<string, WorldLocation>
export const cityById = Object.fromEntries(cities.map((c) => [c.id, c])) as Record<string, City>
export const factionById = Object.fromEntries(factions.map((f) => [f.id, f])) as Record<string, Faction>
export const questById = Object.fromEntries(quests.map((q) => [q.id, q])) as Record<string, Quest>
export const itemById = Object.fromEntries(items.map((i) => [i.id, i])) as Record<string, Item>
export const raceById = Object.fromEntries(races.map((r) => [r.id, r]))

export const locationTypeLabels: Record<string, { zh: string; en: string }> = {
  city: { zh: '城市', en: 'City' },
  town: { zh: '城镇', en: 'Town' },
  village: { zh: '村庄', en: 'Village' },
  farm: { zh: '农场', en: 'Farm' },
  castle: { zh: '城堡', en: 'Castle' },
  fort: { zh: '堡垒', en: 'Fort' },
  cave: { zh: '洞穴', en: 'Cave' },
  'nordic-ruin': { zh: '诺德遗迹', en: 'Nordic Ruin' },
  'dwemer-ruin': { zh: '矮人遗迹', en: 'Dwemer Ruin' },
  'dragon-shrine': { zh: '龙祭坛', en: 'Dragon Shrine' },
  temple: { zh: '神庙', en: 'Temple' },
  mine: { zh: '矿场', en: 'Mine' },
  shop: { zh: '商店', en: 'Shop' },
  tavern: { zh: '酒馆', en: 'Tavern' },
  hall: { zh: '厅堂', en: 'Hall' },
  landmark: { zh: '地标', en: 'Landmark' },
  camp: { zh: '营地', en: 'Camp' },
  dock: { zh: '码头', en: 'Docks' },
  grove: { zh: '林地', en: 'Grove' },
  stronghold: { zh: '要塞', en: 'Stronghold' },
  lighthouse: { zh: '灯塔', en: 'Lighthouse' },
  college: { zh: '学院', en: 'College' },
  ruin: { zh: '废墟', en: 'Ruin' },
}

export const questCategoryName = (id: string) => questCategoryLabels[id]?.zh ?? id
export const itemCategoryName = (id: string) => itemCategoryLabels[id]?.zh ?? id

export const dangerLabel = (d: number) => (d === 0 ? '安全' : d <= 2 ? '低危' : d === 3 ? '危险' : d === 4 ? '高危' : '致命')

/** 合并城市与地点，供搜索与地图使用 */
export interface PlaceEntry {
  id: string
  name: { en: string; zh: string }
  type: string
  typeLabel: string
  regionId: RegionId
  summary: string
  pos?: [number, number]
  cityId?: string
  interior: boolean
  danger: number
  kind: 'city' | 'location'
}

export const placeEntries: PlaceEntry[] = [
  ...cities.map<PlaceEntry>((c) => ({
    id: c.id,
    name: c.name,
    type: c.type === 'city' ? 'city' : 'town',
    typeLabel: c.type === 'city' ? '城市' : '城镇',
    regionId: c.regionId,
    summary: c.summary,
    pos: c.pos,
    interior: false,
    danger: 0,
    kind: 'city',
  })),
  ...locations.map<PlaceEntry>((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    typeLabel: locationTypeLabels[l.type]?.zh ?? l.type,
    regionId: l.regionId,
    summary: l.summary,
    pos: l.pos,
    cityId: l.cityId,
    interior: Boolean(l.interior),
    danger: l.danger,
    kind: 'location',
  })),
]

export const placeById = Object.fromEntries(placeEntries.map((p) => [p.id, p])) as Record<string, PlaceEntry>

export const getCharacter = (id?: string) => (id ? characterById[id] : undefined)
export const getQuest = (id?: string) => (id ? questById[id] : undefined)
export const getItem = (id?: string) => (id ? itemById[id] : undefined)
export const getFaction = (id?: string) => (id ? factionById[id] : undefined)
export const getCity = (id?: string) => (id ? cityById[id] : undefined)
export const getLocation = (id?: string) => (id ? locationById[id] : undefined)

/** 过滤无效引用，避免数据缺口导致页面报错 */
export const charactersFor = (ids: string[] = []): Character[] =>
  ids.map((id) => characterById[id]).filter(Boolean)
export const questsFor = (ids: string[] = []): Quest[] => ids.map((id) => questById[id]).filter(Boolean)
export const locationsFor = (ids: string[] = []): WorldLocation[] =>
  ids.map((id) => locationById[id]).filter(Boolean)
export const factionsFor = (ids: string[] = []): Faction[] => ids.map((id) => factionById[id]).filter(Boolean)

export const holdOfCity = (cityId: string): HoldId | undefined => {
  const c = cityById[cityId]
  return c && c.regionId !== 'solstheim' ? (c.regionId as HoldId) : undefined
}

export const regionLabel = (id: string) => {
  if (id === 'solstheim') return '索瑟姆岛'
  return holdById[id as HoldId]?.name.zh ?? id
}

export const cityPlaces = (city: City): WorldLocation[] =>
  city.districtIds.map((id) => locationById[id]).filter(Boolean)

export const locationsInRegion = (regionId: RegionId): WorldLocation[] =>
  locations.filter((l) => l.regionId === regionId)

export const wildernessInRegion = (regionId: RegionId): WorldLocation[] =>
  locations.filter((l) => l.regionId === regionId && !l.interior && l.pos)

export const charactersInRegion = (regionId: RegionId): Character[] =>
  characters.filter((c) => c.regionId === regionId)

export const questsInRegion = (regionId: RegionId): Quest[] =>
  quests.filter((q) => q.regionId === regionId || q.locationIds.some((lid) => locationById[lid]?.regionId === regionId))

export const questsOfFaction = (factionId: string): Quest[] => quests.filter((q) => q.factionId === factionId)

export const questsOfCharacter = (characterId: string): Quest[] =>
  quests.filter((q) => q.giverId === characterId || q.keyCharacterIds.includes(characterId))

export const charactersAtLocation = (locationId: string): Character[] =>
  characters.filter((c) => c.locationId === locationId)

export const relationsOf = (characterId: string): Relationship[] =>
  relationships.filter((r) => r.from === characterId || r.to === characterId)

export const relatedCharacters = (characterId: string): { relation: Relationship; other: Character }[] =>
  relationsOf(characterId)
    .map((relation) => {
      const otherId = relation.from === characterId ? relation.to : relation.from
      const other = characterById[otherId]
      return other ? { relation, other } : undefined
    })
    .filter((x): x is { relation: Relationship; other: Character } => Boolean(x))

export const itemsForLocation = (locationId: string): Item[] => items.filter((i) => i.locationId === locationId)
export const itemsForQuest = (questId: string): Item[] => items.filter((i) => i.questId === questId)

export const questCategories: QuestCategory[] = [
  'main',
  'side',
  'imperial',
  'stormcloak',
  'companions',
  'thieves-guild',
  'dark-brotherhood',
  'college',
  'daedric',
  'dawnguard',
  'dragonborn',
]

export interface SearchHit {
  id: string
  kind: 'place' | 'character' | 'quest' | 'faction' | 'item'
  title: string
  subtitle: string
  to: string
}

export const globalSearch = (raw: string, limit = 12): SearchHit[] => {
  const q = raw.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  const match = (s: string) => s.toLowerCase().includes(q)

  for (const p of placeEntries) {
    if (match(p.name.zh) || match(p.name.en) || match(p.summary)) {
      hits.push({
        id: p.id,
        kind: 'place',
        title: p.name.zh,
        subtitle: `${regionLabel(p.regionId)} · ${p.typeLabel}`,
        to: p.kind === 'city' ? `/city/${p.id}` : `/location/${p.id}`,
      })
    }
  }
  for (const c of characters) {
    if (match(c.name.zh) || match(c.name.en) || match(c.role)) {
      hits.push({
        id: c.id,
        kind: 'character',
        title: c.name.zh,
        subtitle: `${c.role} · ${regionLabel(c.regionId)}`,
        to: `/characters?focus=${c.id}`,
      })
    }
  }
  for (const quest of quests) {
    if (match(quest.name.zh) || match(quest.name.en) || match(quest.summary)) {
      hits.push({
        id: quest.id,
        kind: 'quest',
        title: quest.name.zh,
        subtitle: `任务 · ${quest.name.en}`,
        to: `/quests?focus=${quest.id}`,
      })
    }
  }
  for (const f of factions) {
    if (match(f.name.zh) || match(f.name.en)) {
      hits.push({ id: f.id, kind: 'faction', title: f.name.zh, subtitle: '势力', to: `/factions?focus=${f.id}` })
    }
  }
  for (const it of items) {
    if (match(it.name.zh) || match(it.name.en)) {
      hits.push({ id: it.id, kind: 'item', title: it.name.zh, subtitle: '收藏品', to: `/collections?focus=${it.id}` })
    }
  }

  return hits.slice(0, limit)
}
