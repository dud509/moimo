import { genesFromName, randomKoreanName, splitName, type MoimoGenes } from '../moimo/name'

/* ================================================================== *
 *  마을 인구는 여기서 조절한다                                          *
 * ================================================================== */

/** 13인치(1440×900) 화면에 심어둘 이웃 수. 화면이 넓으면 그만큼 더 심는다 */
export const SEED_COUNT = 230

/**
 * 한 화면에 둘 수 있는 최대 인원.
 * 넘으면 심어둔 이웃부터 조용히 자리를 비켜준다 —
 * 사람이 만든 모이모는 끝까지 남는다.
 */
export const MAX_RESIDENTS = 560

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
  /** 화면에 보이는 폭(px) */
  w: number
  /**
   * 그림이 500 캔버스에서 실제로 차지하는 비율.
   * 여백이 넓은 파일은 그만큼 키워서 보여 줘야 다른 것과 크기가 맞는다
   */
  fill: number
  /** 모이모가 겹치지 않게 비워둘 반경 */
  keepout: number
}

/**
 * 마을에 놓인 오브제.
 *
 * 처음 열었을 때 네 개가 한 화면에 다 들어오도록 유리병을 가운데 두고
 * 네 귀퉁이로 벌려 둔다. 오른쪽 아래는 비어 있다 —
 * 플레이어는 그림이 아직 없어 빼 두었고, 노래는 아래 띠에서 켠다.
 */
export const ITEMS: Item[] = [
  { id: 'jar',    name: '별사탕 유리병', tag: '모이모 만들기', x: 1800, y: 1180, w: 340, fill: 0.76, keepout: 210 },
  { id: 'camera', name: '카메라',       tag: '같이 사진찍기', x: 1080, y: 830,  w: 260, fill: 0.58, keepout: 165 },
  { id: 'album',  name: '앨범',         tag: '기록과 방명록', x: 2520, y: 830,  w: 280, fill: 0.71, keepout: 165 },
  { id: 'glass',  name: '돋보기',       tag: '이름 찾아보기', x: 1080, y: 1620, w: 240, fill: 0.46, keepout: 150 },
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
/** 서로 아예 겹치지 않도록 둘 사이에 두는 거리 */
export const MIN_GAP = MOIMO_W

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
    // 소품은 같은 바닥에 나란히 놓이므로 스쳐도 된다. 얼굴만 가리지 않게 비켜 준다
    for (const p of PROPS) {
      const d = 24 + p.w * 0.3
      if (Math.abs(x - p.x) < d && Math.abs(by - p.y) < d) return false
    }
    // 모이모끼리는 아예 겹치지 않는다. 가운데 거리로 재면 모서리끼리 물려서 네모로 잰다
    for (const t of taken) if (Math.abs(x - t.x) < gap && Math.abs(y - t.y) < gap) return false
    return true
  }

  for (let attempt = 0; attempt < 500; attempt++) {
    const k = n + attempt * 0.41
    const r = 52 * Math.sqrt(k + 3)
    const a = k * GOLDEN + (attempt ? rnd() * 0.7 : 0)
    const x = CENTER.x + Math.cos(a) * r * 1.34 + (rnd() - 0.5) * 34
    const y = CENTER.y + Math.sin(a) * r * 0.92 + (rnd() - 0.5) * 26
    if (free(x, y, MIN_GAP)) return { x, y }
  }

  // 나선으로 못 찾았으면 아무 데나 던져 보되, 규칙은 그대로 지킨다
  for (let i = 0; i < 1200; i++) {
    const x = 180 + rnd() * (WORLD.w - 360)
    const y = 220 + rnd() * (WORLD.h - 400)
    if (free(x, y, MIN_GAP)) return { x, y }
  }
  // 그래도 못 찾았으면 마을을 격자로 훑는다. 빈칸이 있으면 반드시 걸린다
  const step = MOIMO_W / 4
  for (let y = WORLD.h - 120; y > 140; y -= step) {
    for (let x = 130; x < WORLD.w - 130; x += step) {
      if (free(x, y, MIN_GAP)) return { x, y }
    }
  }
  return { x: 200, y: WORLD.h - 160 }
}

/* ------------------------------------------------------------------ */
/* 소품 — 캐릭터 사이사이에 깔리는 작은 그림들                            */
/* ------------------------------------------------------------------ */

/**
 * 소품 한 종류.
 * `fill` 은 그림이 500 캔버스에서 실제로 차지하는 비율 —
 * 별사탕은 11%뿐이라 그대로 놓으면 먼지만 해진다.
 * `weight` 는 많이 깔릴수록 크다. 별사탕은 흩뿌리고 상자는 드문드문.
 */
export type PropKind = { src: string; fill: number; min: number; max: number; weight: number }

export const PROP_KINDS: PropKind[] = [
  { src: '/items/starcandy01.svg', fill: 0.11, min: 26, max: 48, weight: 5 },
  { src: '/items/starcandy02.svg', fill: 0.11, min: 26, max: 48, weight: 5 },
  { src: '/items/starcandy03.svg', fill: 0.10, min: 26, max: 48, weight: 5 },
  { src: '/items/box01.svg',       fill: 0.60, min: 96, max: 152, weight: 1 },
  { src: '/items/box02.svg',       fill: 0.48, min: 96, max: 152, weight: 1 },
]

export type Prop = {
  id: string
  x: number
  y: number
  /** 화면에 보이는 폭(px) */
  w: number
  /** 기울기(도) */
  rot: number
  flip: boolean
  /** PROP_KINDS 의 몇 번째 그림인지 */
  kind: number
}

/** 마을 전체에 흩뿌릴 소품 수 */
export const PROP_COUNT = 260

/** 기울여 놓으면 네모가 그만큼 커진다. 자리를 잴 때 얹어 준다 */
const ROT_PAD = 1.2
/** 무게를 다 더한 값 — 종류를 뽑을 때 쓴다 */
const WEIGHT_SUM = PROP_KINDS.reduce((a, k) => a + k.weight, 0)

/**
 * 소품을 흩뿌린다.
 *
 * 오브제도 소품끼리도 비켜 간다. 모이모는 이 자리를 피해서 선다 —
 * 소품과 모이모는 같은 바닥에 나란히 놓이지 겹쳐 쌓이지 않는다.
 */
export function scatterProps(count = PROP_COUNT): Prop[] {
  let s = 19980423
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }

  const out: Prop[] = []
  const free = (x: number, y: number, w: number) => {
    if (x < 90 || x > WORLD.w - 90 || y < 110 || y > WORLD.h - 90) return false
    for (const it of ITEMS) {
      const g = itemGuard(it)
      if (Math.abs(x - g.cx) < g.hw + w * 0.75 && Math.abs(y - g.cy) < g.hh + w * 0.75) return false
    }
    // 소품끼리도 네모로 재서 붙지 않게 한다
    for (const p of out) {
      const d = (w + p.w) * ROT_PAD / 2
      if (Math.abs(x - p.x) < d && Math.abs(y - p.y) < d) return false
    }
    return true
  }

  for (let i = 0; i < count; i++) {
    let t = rnd() * WEIGHT_SUM
    let kind = 0
    while (kind < PROP_KINDS.length - 1 && (t -= PROP_KINDS[kind].weight) > 0) kind++
    const k = PROP_KINDS[kind]
    const w = Math.round(k.min + rnd() * (k.max - k.min))
    for (let attempt = 0; attempt < 90; attempt++) {
      const x = 90 + rnd() * (WORLD.w - 180)
      const y = 110 + rnd() * (WORLD.h - 200)
      // 한가운데는 모이모가 먼저 차지하는 자리라 조금 비워 준다
      const core = Math.hypot((x - CENTER.x) / 1.34, (y - CENTER.y) / 0.92)
      if (core < 300 && rnd() < 0.5) continue
      if (!free(x, y, w)) continue
      out.push({ id: `prop-${i}`, x, y, w, rot: (rnd() - 0.5) * 24, flip: rnd() < 0.5, kind })
      break
    }
  }
  return out
}

/**
 * 마을에 깔린 소품. 한 번 정해지면 변하지 않는다 —
 * 모이모는 이 자리를 보고 비켜서 선다.
 */
export const PROPS: Prop[] = scatterProps()

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
