import { genesFromName, randomKoreanName, splitName, type MoimoGenes } from '../moimo/name'

/* ================================================================== *
 *  마을 인구는 여기서 조절한다                                          *
 * ================================================================== */

/** 13인치(1440×900) 화면에 심어둘 이웃 수. 화면이 넓으면 그만큼 더 심는다 */
export const SEED_COUNT = 90

/**
 * 한 화면에 둘 수 있는 최대 인원.
 * 넘으면 심어둔 이웃부터 조용히 자리를 비켜준다 —
 * 사람이 만든 모이모는 끝까지 남는다.
 */
export const MAX_RESIDENTS = 260

/* ================================================================== */

/**
 * 마을의 크기. 화면에 한 번에 다 들어오지 않고 끌어서 돌아다닌다.
 * 27인치(2560px)에서도 둘레가 비지 않으려면 기본 배율 × 이 폭이
 * 화면보다 커야 한다 — 3600 × 0.75 = 2700.
 */
export const WORLD = { w: 3600, h: 2400 }
export const CENTER = { x: 1800, y: 1200 }

export type ItemId = 'jar' | 'camera' | 'album' | 'glass' | 'music'

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
  { id: 'jar',    name: '별사탕 유리병', tag: '모이모 만들기', x: 1800, y: 1180, w: 300, keepout: 210 },
  { id: 'camera', name: '카메라',       tag: '같이 사진찍기', x: 870,  y: 640,  w: 250, keepout: 165 },
  { id: 'album',  name: '앨범',         tag: '기록과 방명록', x: 2760, y: 690,  w: 250, keepout: 165 },
  { id: 'glass',  name: '돋보기',       tag: '이름 찾아보기', x: 1110, y: 1840, w: 230, keepout: 150 },
  { id: 'music',  name: '플레이어',     tag: '노래 켜기',     x: 2700, y: 1800, w: 220, keepout: 150 },
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

/** 모이모가 화면에 놓이는 크기. 겹침을 따질 때 쓴다 */
export const MOIMO_W = 104
/** 서로 3분의 1 넘게 겹치지 않도록 둘 사이에 두는 거리 */
export const MIN_GAP = Math.ceil(MOIMO_W * (2 / 3))

/**
 * 오브제가 화면에서 차지하는 네모.
 *
 * x,y 는 왼쪽 위 모서리가 아니라 «아래 한가운데» 다. 그리기에서 위로
 * 86% 만큼 끌어올리기 때문이다. 이름표가 아래로 조금 더 나온다.
 */
const ITEM_LIFT = 0.86
const ITEM_LABEL = 46

function itemGuard(it: Item) {
  const pad = 14
  const top = it.y - ITEM_LIFT * it.w
  const bottom = it.y + (1 - ITEM_LIFT) * it.w + ITEM_LABEL
  return {
    cx: it.x,
    cy: (top + bottom) / 2,
    hw: it.w / 2 + pad,
    hh: (bottom - top) / 2 + pad,
  }
}

/**
 * n번째 주민의 자리.
 *
 * 별사탕 유리병을 중심으로 나선을 그리며 바깥으로 퍼진다 —
 * 사람이 늘수록 가운데부터 차곡차곡 와글와글해진다.
 *
 * 오브제를 가리지 않고, 이미 자리 잡은 모이모와도 너무 붙지 않는 자리를
 * 찾는다. 못 찾으면 나선을 한 바퀴 더 돌며 바깥으로 밀려난다.
 */
export function spotFor(
  n: number,
  rnd: () => number,
  taken: { x: number; y: number }[] = [],
): { x: number; y: number } {
  /** 이 자리에 서도 되나 — 오브제를 가리지 않고 이웃과도 떨어져 있나 */
  const free = (x: number, y: number, gap: number) => {
    if (x < 120 || x > WORLD.w - 120 || y < 140 || y > WORLD.h - 110) return false
    // x,y 는 발치이고 몸은 그 위로 올라가므로 몸 한가운데를 기준으로 잰다
    const by = y - MOIMO_W / 2
    for (const it of ITEMS) {
      const g = itemGuard(it)
      if (Math.abs(x - g.cx) < g.hw + MOIMO_W / 2 && Math.abs(by - g.cy) < g.hh + MOIMO_W / 2) return false
    }
    for (const t of taken) if (Math.hypot(x - t.x, y - t.y) < gap) return false
    return true
  }

  for (let attempt = 0; attempt < 220; attempt++) {
    const k = n + attempt * 0.41
    const r = 56 * Math.sqrt(k + 3)
    const a = k * GOLDEN + (attempt ? rnd() * 0.7 : 0)
    const x = CENTER.x + Math.cos(a) * r * 1.34 + (rnd() - 0.5) * 34
    const y = CENTER.y + Math.sin(a) * r * 0.92 + (rnd() - 0.5) * 26
    if (free(x, y, MIN_GAP)) return { x, y }
  }

  // 나선으로 못 찾았으면 아무 데나 던져 보되, 규칙은 그대로 지킨다.
  // 그래도 안 되면 이웃 사이 거리만 조금씩 좁힌다. 오브제는 끝까지 비켜 간다
  for (let gap = MIN_GAP; gap >= 24; gap -= 8) {
    for (let i = 0; i < 400; i++) {
      const x = 180 + rnd() * (WORLD.w - 360)
      const y = 220 + rnd() * (WORLD.h - 400)
      if (free(x, y, gap)) return { x, y }
    }
  }
  return { x: 200, y: WORLD.h - 160 }
}

export function makeResident(
  genes: MoimoGenes, name: string, n: number, rnd: () => number, mine: boolean, note?: string,
  taken: { x: number; y: number }[] = [],
): Resident {
  const { x, y } = spotFor(n, rnd, taken)
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
    const { x, y } = spotFor(out.length, rnd, out)
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

/**
 * 이 화면에 몇 명을 심을지.
 * 27인치에서 90명만 심으면 가운데만 북적이고 둘레가 휑하다.
 * 넓이에 비례해 늘리되 상한은 넘기지 않는다.
 */
export function seedCountFor(vw: number, vh: number): number {
  const k = (vw * vh) / (1440 * 900)
  return Math.round(Math.min(MAX_RESIDENTS, Math.max(40, SEED_COUNT * k)))
}

export function loadWorld(seeds = SEED_COUNT): Resident[] {
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
  return seedResidents(seeds)
}

export function saveWorld(list: Resident[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 용량 초과 등 */ }
}

export function resetWorld() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

/**
 * 상한을 넘으면 심어둔 이웃부터 내보낸다.
 * 바깥쪽(나중에 심은 쪽)부터 비우므로 가운데 밀도는 그대로 남는다.
 */
export function trimWorld(list: Resident[]): Resident[] {
  if (list.length <= MAX_RESIDENTS) return list
  const made = list.filter((r) => r.mine)
  const seeds = list.filter((r) => !r.mine)
  if (made.length >= MAX_RESIDENTS) return made.slice(made.length - MAX_RESIDENTS)
  return [...seeds.slice(0, MAX_RESIDENTS - made.length), ...made]
}

/** 이름만 있으면 주민이 된다 */
export function residentFromName(
  raw: string, n: number, note?: string, taken: { x: number; y: number }[] = [],
): Resident | null {
  const parts = splitName(raw)
  if (!parts) return null
  const genes = genesFromName(raw)
  if (!genes) return null
  return makeResident(genes, parts.full, n, Math.random, true, note, taken)
}
