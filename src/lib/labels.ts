import type { Allegiance, EquipSlot, ItemCategory, QuestStatus, RelationKind, Weather } from '@/types'

export const questStatusLabels: Record<QuestStatus, string> = {
  'not-started': '尚未开始',
  active: '进行中',
  completed: '已完成',
  abandoned: '已放弃',
}

export const questStatusTone: Record<QuestStatus, 'muted' | 'gold' | 'moss' | 'blood'> = {
  'not-started': 'muted',
  active: 'gold',
  completed: 'moss',
  abandoned: 'blood',
}

export const relationKindLabels: Record<RelationKind, string> = {
  family: '亲属',
  marriage: '婚姻',
  political: '政治',
  military: '军事',
  friend: '友人',
  rival: '敌对',
  organization: '同组织',
  mentor: '师徒',
}

export const equipSlotLabels: Record<EquipSlot, string> = {
  head: '头部',
  chest: '胸甲',
  hands: '手部',
  feet: '足部',
  weapon: '武器',
  shield: '盾牌',
  amulet: '项链',
  ring: '戒指',
}

export const allegianceLabels: Record<Allegiance, string> = {
  imperial: '帝国',
  stormcloak: '风暴斗篷',
  neutral: '中立',
}

export const allegianceTone: Record<Allegiance, 'blood' | 'frost' | 'muted'> = {
  imperial: 'blood',
  stormcloak: 'frost',
  neutral: 'muted',
}

export const weatherTone: Record<Weather, string> = {
  clear: '#c9a227',
  cloudy: '#8d959c',
  rain: '#7d96a8',
  snow: '#a8c8d8',
  blizzard: '#d6e4ec',
  fog: '#9aa39a',
}

export const itemCategoryTone: Record<ItemCategory, string> = {
  weapon: '#b0763c',
  armor: '#8a8f96',
  magic: '#8f7fb8',
  artifact: '#c9a227',
  mask: '#b8a37a',
  book: '#a8b48a',
  relic: '#c08a5a',
  ingredient: '#7fa07a',
  misc: '#9a9a9a',
}

export const rarityLabels: Record<string, string> = {
  common: '常见',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  artifact: '神器',
}

export const formatDate = (ts?: number) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const formatDateTime = (ts?: number) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${formatDate(ts)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
