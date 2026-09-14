import { genesFromName, randomKoreanName, splitName, type MoimoGenes } from '../moimo/name'

export const WORLD = { w: 2600, h: 1700 }
export const CENTER = { x: 1300, y: 880 }

export type ItemId = 'jar' | 'camera' | 'album' | 'glass'

export type Item = {
  id: ItemId
  name: string
  tag: string
  x: number
  y: number
  /** 화면상 폭(px) */
  w: number
  /** 모이모가 겹치지 않게 비워둘 반경 */
  keepout: number
}

export const ITEMS: Item[] = [
  { id: 'jar',    name: '별사탕 유리병', tag: '모이모 만들기', x: 1300, y: 860,  w: 300, keepout: 210 },
  { id: 'camera', name: '카메라',       tag: '같이 사진찍기', x: 560,  y: 470,  w: 250, keepout: 165 },
  { id: 'album',  name: '앨범',         tag: '기록과 방명록', x: 2040, y: 500,  w: 250, keepout: 165 },
  { id: 'glass',  name: '돋보기',       tag: '이름 찾아보기', x: 780,  y: 1330, w: 230, keepout: 150 },
]

/* ------------------------------------------------------------------ */

export type Resident = {
  id: string
  name: string
  genes: MoimoGenes
  x: number
  y: number
  flip: boolean
  /** 흔들림 위상 */
  phase: number
  at: number
  mine: boolean
  /** 방명록 한 줄 */
  note?: string
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * n번째 주민의 자리.
 * 별사탕 유리병을 중심으로 나선을 그리며 바깥으로 퍼진다 —
 * 사람이 늘수록 가운데부터 차곡차곡 와글와글해진다.
 */
export function spotFor(n: number, rnd: () => number): { x: number; y: number } {
  for (let attempt = 0; attempt < 40; attempt++) {
    const k = n + attempt * 0.41
    const r = 56 * Math.sqrt(k + 3)
    const a = k * GOLDEN + (attempt ? rnd() * 0.7 : 0)
    const x = CENTER.x + Math.cos(a) * r * 1.34 + (rnd() - 0.5) * 34
    const y = CENTER.y + Math.sin(a) * r * 0.92 + (rnd() - 0.5) * 26
    if (x < 120 || x > WORLD.w - 120 || y < 140 || y > WORLD.h - 110) continue
    if (ITEMS.some((it) => Math.hypot(x - it.x, y - it.y) < it.keepout)) continue
    return { x, y }
  }
  return { x: 180 + rnd() * (WORLD.w - 360), y: 220 + rnd() * (WORLD.h - 400) }
}

export function makeResident(
  genes: MoimoGenes, name: string, n: number, rnd: () => number, mine: boolean, note?: string,
): Resident {
  const { x, y } = spotFor(n, rnd)
  return {
    id: `${Date.now().toString(36)}-${Math.floor(rnd() * 1e6).toString(36)}`,
    name, genes, x, y,
    flip: rnd() < 0.42,
    phase: rnd(),
    at: Date.now(),
    mine,
    note,
  }
}

/** 처음 온 사람에게도 마을이 비어 보이지 않도록 심어두는 이웃들 */
export function seedResidents(count: number): Resident[] {
  let s = 20260914
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  const out: Resident[] = []
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const name = randomKoreanName(rnd)
    const genes = genesFromName(name)
    if (!genes) continue
    const { x, y } = spotFor(out.length, rnd)
    out.push({
      id: `seed-${out.length}`,
      name, genes, x, y,
      flip: rnd() < 0.42,
      phase: rnd(),
      at: 0,
      mine: false,
    })
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 저장 — 지금은 이 브라우저에만. 나중에 서버로 갈아끼운다               */
/* ------------------------------------------------------------------ */

const KEY = 'moimo.world.v1'
const SEED_COUNT = 220

const SLOT_KEYS = ['body', 'color', 'morph', 'eye', 'mouth', 'cheek', 'hair', 'tail', 'deco'] as const

/** 저장된 주민 한 명이 쓸 만한 모양인지 */
function usable(r: unknown): r is Resident {
  if (!r || typeof r !== 'object') return false
  const v = r as Record<string, unknown>
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return false
  if (typeof v.x !== 'number' || typeof v.y !== 'number') return false
  const g = v.genes as Record<string, unknown> | undefined
  if (!g) return false
  return SLOT_KEYS.every((k) => typeof g[k] === 'number' && Number.isFinite(g[k] as number))
}

export function loadWorld(): Resident[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // 예전 형식이 섞여 있어도 쓸 수 있는 것만 살린다
        const ok = parsed.filter(usable)
        if (ok.length) return ok
      }
    }
  } catch {
    /* 저장소를 못 읽어도 마을은 열려야 한다 */
  }
  return seedResidents(SEED_COUNT)
}

export function saveWorld(list: Resident[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 용량 초과 등 */ }
}

export function resetWorld() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

/** 이름만 있으면 주민이 된다 */
export function residentFromName(raw: string, n: number, note?: string): Resident | null {
  const parts = splitName(raw)
  if (!parts) return null
  const genes = genesFromName(raw)
  if (!genes) return null
  return makeResident(genes, parts.full, n, Math.random, true, note)
}
