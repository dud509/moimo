import { mulberry32, randomGenes, randomName, type Genes } from '../moimo/genes'

export const WORLD = { w: 3600, h: 2400 }
export const PLAZA = { x: 1800, y: 1180 }

export type LandmarkId = 'workshop' | 'archive' | 'tree' | 'fountain' | 'info'

export type Landmark = {
  id: LandmarkId
  name: string
  tag: string
  x: number
  y: number
  /** 오브제 폭(px). 높이는 그림마다 다름 */
  w: number
  /** 모이모가 겹치지 않게 비워둘 반경 */
  keepout: number
}

export const LANDMARKS: Landmark[] = [
  { id: 'workshop', name: '모이모 공방', tag: '만들기', x: 1010, y: 860, w: 440, keepout: 250 },
  { id: 'archive', name: '모이모 도감', tag: '전체 보기', x: 2620, y: 900, w: 420, keepout: 240 },
  { id: 'tree', name: '조합의 나무', tag: '몇 가지일까', x: 1360, y: 1780, w: 480, keepout: 250 },
  { id: 'fountain', name: '한가운데 분수', tag: '뽑기', x: 1800, y: 1180, w: 300, keepout: 180 },
  { id: 'info', name: '마을 안내소', tag: '프로젝트', x: 2500, y: 1800, w: 360, keepout: 210 },
]

/* ------------------------------------------------------------------ */
/* 주민                                                                */
/* ------------------------------------------------------------------ */

export type Resident = {
  id: string
  name: string
  genes: Genes
  x: number
  y: number
  /** 좌우 반전 */
  flip: boolean
  /** 애니메이션 위상 */
  phase: number
  /** 도착 시각 */
  at: number
  /** 사람이 직접 만든 모이모인지 */
  mine: boolean
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/**
 * n번째 주민의 자리.
 * 광장에서부터 나선으로 바깥으로 퍼진다 — 사람이 많아질수록
 * 가운데부터 차곡차곡 와글와글해진다.
 */
export function spotFor(n: number, rnd: () => number): { x: number; y: number } {
  for (let attempt = 0; attempt < 40; attempt++) {
    const k = n + attempt * 0.37
    const r = 118 * Math.sqrt(k + 1.6)
    const a = k * GOLDEN + (attempt ? rnd() * 0.6 : 0)
    const x = PLAZA.x + Math.cos(a) * r * 1.28 + (rnd() - 0.5) * 62
    const y = PLAZA.y + Math.sin(a) * r * 0.92 + (rnd() - 0.5) * 46
    if (x < 180 || x > WORLD.w - 180 || y < 200 || y > WORLD.h - 160) continue
    if (LANDMARKS.some((l) => Math.hypot(x - l.x, y - l.y) < l.keepout)) continue
    return { x, y }
  }
  return {
    x: 200 + rnd() * (WORLD.w - 400),
    y: 260 + rnd() * (WORLD.h - 460),
  }
}

export function makeResident(genes: Genes, name: string, n: number, rnd: () => number, mine: boolean): Resident {
  const { x, y } = spotFor(n, rnd)
  return {
    id: `${Date.now().toString(36)}-${Math.floor(rnd() * 1e6).toString(36)}`,
    name, genes, x, y,
    flip: rnd() < 0.45,
    phase: rnd(),
    at: Date.now(),
    mine,
  }
}

/** 처음 온 사람에게도 마을이 비어 보이지 않도록 심어두는 주민들 */
export function seedResidents(count: number): Resident[] {
  const rnd = mulberry32(20260901)
  const out: Resident[] = []
  for (let i = 0; i < count; i++) {
    const { x, y } = spotFor(i, rnd)
    out.push({
      id: `seed-${i}`,
      name: randomName(rnd),
      genes: randomGenes(rnd),
      x, y,
      flip: rnd() < 0.45,
      phase: rnd(),
      at: 0,
      mine: false,
    })
  }
  return out
}

/* ------------------------------------------------------------------ */
/* 저장                                                                */
/* ------------------------------------------------------------------ */

const KEY = 'moimo.village.v1'
const SEED_COUNT = 96

export function loadVillage(): Resident[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed as Resident[]
    }
  } catch {
    /* 저장소를 못 읽어도 마을은 열려야 한다 */
  }
  return seedResidents(SEED_COUNT)
}

export function saveVillage(list: Resident[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* 용량 초과 등 — 화면은 그대로 둔다 */
  }
}

export function resetVillage() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}
