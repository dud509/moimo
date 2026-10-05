import { genesFromName, randomKoreanName, splitName, type MoimoGenes } from '../moimo/name'

/* ================================================================== *
 *  마을 인구는 여기서 조절한다                                          *
 * ================================================================== */

/** 처음 심어 둘 이웃 수 — 화면 크기와 상관없이 같다 */
export const SEED_COUNT = 300

/**
 * 한 화면에 둘 수 있는 최대 인원.
 * 넘으면 심어둔 이웃부터 조용히 자리를 비켜준다 —
 * 사람이 만든 모이모는 끝까지 남는다.
 */
export const MAX_RESIDENTS = 420

/* ================================================================== */

/**
 * 마을의 크기. 화면에 한 번에 다 들어오지 않고 끌어서 돌아다닌다.
 * 27인치(2560px)에서도 둘레가 비지 않으려면 기본 배율 × 이 폭이
 * 화면보다 커야 한다 — 3600 × 0.75 = 2700.
 */
export const WORLD = { w: 3600, h: 2400 }
export const CENTER = { x: 1800, y: 1200 }

/**
 * 시안 한 장 — 처음 열었을 때 화면을 꽉 채우는 네모.
 * 꾸밈 오브제는 이 가장자리에 걸쳐 잘려 보이고, 모이모는 이 테두리에 걸쳐
 * 서지 않는다(처음 화면에서 잘려 보이지 않게). 줄이면 바깥 마을도 보인다.
 * 시안(1466×978) 의 1px 이 마을의 1.3336px 이다.
 */
export const FRAME = { x0: 822, y0: 548, x1: 2778, y1: 1852 }

/** 테두리에서 이만큼은 비켜 선다 — 아래는 메뉴 띠에 가리지 않게 더 넉넉히 */
const EDGE = { side: 12, top: 16, bottom: 96 }

import type { Footprint } from './footprint'
import { VILLAGERS } from './villagers'

export type ItemId = 'jar' | 'camera' | 'album' | 'glass' | 'music'

/**
 * 마을에 놓인 그림 한 점.
 *
 * x, y 는 그림의 «한가운데» 다. w 는 화면에 보이는 폭(px) 이고, 여백은
 * 잘라내고 재므로 아트보드 크기와 상관없다. ratio 는 세로/가로 비로,
 * 모이모와 별사탕이 비켜 설 자리를 그림이 뜨기 전에 미리 재려고 적어 둔다.
 */
export type Placed = {
  src: string
  x: number
  y: number
  w: number
  ratio: number
}


export type Item = Placed & {
  id: ItemId
  name: string
  tag: string
}

/**
 * 누를 수 있는 오브제.
 *
 * 자리는 시안 그림(1466×978, 처음 배율 0.75)에서 옮겨 왔다 — 시안의
 * 1px 이 마을의 1.333px 이고, 시안 한가운데가 마을 한가운데(CENTER)다.
 */
export const ITEMS: Item[] = [
  { id: 'jar',    name: '별사탕 유리병', tag: '모이모 만들기', src: '/items/jar02.svg',  x: 1811, y: 1212, w: 337, ratio: 1.23 },
  { id: 'camera', name: '카메라',       tag: '같이 사진찍기', src: '/items/camera.svg', x: 1195, y: 900, w: 257, ratio: 1.053 },
  { id: 'album',  name: '앨범',         tag: '기록과 방명록', src: '/items/album.svg',  x: 2371, y: 864, w: 361, ratio: 0.774 },
  { id: 'glass',  name: '돋보기',       tag: '이름 찾아보기', src: '/items/glass.svg',  x: 1348, y: 1657, w: 197, ratio: 1.172 },
]

/** 누를 수 없는 오브제 — 마을을 꾸미는 큰 물건들 */
export const DECOR: Placed[] = [
  { src: '/items/inbox02.svg', x: 897, y: 770, w: 285, ratio: 0.836 },
  { src: '/items/gift.svg',    x: 1572, y: 753, w: 227, ratio: 0.967 },
  { src: '/items/book.svg',    x: 1159, y: 1315, w: 347, ratio: 0.775 },
  { src: '/items/inbox01.svg', x: 2668, y: 1306, w: 448, ratio: 0.854 },
  { src: '/items/box01.svg',   x: 1990, y: 1691, w: 289, ratio: 0.915 },
]

/** 유리병 곁에 서 있는 안내 캐릭터 둘 */
export const GUIDES: Placed[] = [
  { src: '/items/guide01.svg', x: 1991, y: 1124, w: 96, ratio: 0.983 },
  { src: '/items/guide02.svg', x: 1645, y: 1030, w: 89, ratio: 1.069 },
]

/* ------------------------------------------------------------------ */

export type Resident = {
  id: string
  name: string
  genes: MoimoGenes
  x: number
  y: number
  /** 흔들림 위상 */
  phase: number
  at: number
  mine: boolean
  /** 방명록 한 줄 */
  note?: string
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))

/** 모이모가 화면에 놓이는 크기. 겹침을 따질 때 쓴다 */
export const MOIMO_W = 120

/**
 * 화면(마을 좌표)에서의 선 굵기(px).
 * 그림마다 줄여 놓는 비율이 달라 파일 속 숫자로는 굵기가 맞지 않으므로,
 * 화면에서 이 굵기가 되게 선을 고쳐 그린다. 모이모는 손대지 않는다
 * (512 캔버스에 4.5 → 화면에서 약 1.05).
 */
export const OBJECT_LINE_PX = 2.2
export const CANDY_LINE_PX = 1.6
/**
 * 둘 사이에 두는 거리.
 * 어깨가 닿을 만큼은 붙어 서야 와글와글해 보인다 —
 * 겹치지 말아야 할 것은 서로가 아니라 소품과 오브제다.
 */
export const MIN_GAP = Math.ceil(MOIMO_W * 0.72)

/** 그림이 화면에서 차지하는 네모 */
function guard(p: Placed) {
  const pad = 14
  const h = p.w * p.ratio
  return { p, cx: p.x, cy: p.y, hw: p.w / 2 + pad, hh: h / 2 + pad, x0: p.x - p.w / 2, y0: p.y - h / 2, h }
}

/**
 * 오브제마다 잰 외곽선. 그림이 뜨기 전에는 비어 있고, 그동안은 오브제
 * 네모 전체를 피한다. footprint.ts 가 재서 setFootprints 로 넣는다.
 */
let FOOTPRINTS: Record<string, Footprint> = {}
export function setFootprints(f: Record<string, Footprint>) { FOOTPRINTS = f }

/** 그림 위로 이만큼까지는 발을 디디지 않는다 — 바로 뒤에 붙어 서면 올라탄 듯 보인다 */
const ABOVE = 8
/** 그림 바닥선에서 이만큼 위까지는 디뎌도 된다 — 앞에 서서 바닥선에 발이 닿는 정도 */
const BASE = 6

/** 이 점이 그림 위(발을 디딜 수 없는 곳)인가 */
function onArt(g: ReturnType<typeof guard>, f: Footprint, px: number, py: number): boolean {
  const i = Math.floor(((px - g.x0) / g.p.w) * f.length)
  if (i < 0 || i >= f.length) return false
  const col = f[i]
  if (!col) return false
  const top = g.y0 + col[0] * g.h - ABOVE
  const bottom = g.y0 + col[1] * g.h - BASE
  return py > top && py < bottom
}

/** 발바닥 폭의 절반 — 발 양끝도 금지 자리에 걸리면 안 된다 */
const FOOT_HALF = 22

/** 모이모와 별사탕이 비켜 서야 하는 그림들 */
const GUARDS = [...ITEMS, ...DECOR, ...GUIDES].map(guard)

/** 이 자리에 서도 되나 — 오브제를 가리지 않고 이웃과도 떨어져 있나 */
function standsFree(x: number, y: number, gap: number, taken: { x: number; y: number }[]): boolean {
  if (x < 120 || x > WORLD.w - 120 || y < 140 || y > WORLD.h - 110) return false
  // 처음 화면(FRAME) 테두리에 걸쳐 서지 않는다 — 안이든 밖이든 한쪽에만
  const inL = x - MOIMO_W / 2 >= FRAME.x0 + EDGE.side
  const inR = x + MOIMO_W / 2 <= FRAME.x1 - EDGE.side
  const inT = y - MOIMO_W >= FRAME.y0 + EDGE.top
  const inB = y <= FRAME.y1 - EDGE.bottom
  const outside = x + MOIMO_W / 2 < FRAME.x0 || x - MOIMO_W / 2 > FRAME.x1 || y < FRAME.y0 || y - MOIMO_W > FRAME.y1
  if (!(inL && inR && inT && inB) && !outside) return false
  // x,y 는 발치이고 몸은 그 위로 올라가므로 몸 한가운데를 기준으로 잰다
  const by = y - MOIMO_W / 2
  // 그림과 겹쳐도 되는 것은 그 앞에 섰을 때뿐이다. 발바닥이 그림 외곽선
  // 안에 들어가면 그 위에 올라탄 것처럼 떠 보인다.
  // y 는 그림 상자의 바닥이고 실제 발바닥은 그보다 1/4 위에 있다
  const fy = y - MOIMO_W * 0.25
  for (const g of GUARDS) {
    const f = FOOTPRINTS[g.p.src]
    const nearBox = Math.abs(x - g.cx) < g.hw + MOIMO_W / 2 && Math.abs(by - g.cy) < g.hh + MOIMO_W / 2
    if (!nearBox) continue
    // 외곽선을 못 쟀거나 안내 캐릭터면 네모 전체를 피한다
    if (!f || GUIDES.includes(g.p)) return false
    if (onArt(g, f, x, fy) || onArt(g, f, x - FOOT_HALF, fy) || onArt(g, f, x + FOOT_HALF, fy)) return false
  }
  // 소품과는 겹치지 않는다. 소품은 무리 바깥에 있으니 둘레에서만 마주친다
  for (const p of PROPS) {
    const d = (MOIMO_W + p.w * ROT_PAD) / 2
    if (Math.abs(x - p.x) < d && Math.abs(by - p.y) < d) return false
  }
  // 모이모끼리는 아예 겹치지 않는다. 가운데 거리로 재면 모서리끼리 물려서 네모로 잰다
  for (const t of taken) if (Math.abs(x - t.x) < gap && Math.abs(y - t.y) < gap) return false
  return true
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
  const free = (x: number, y: number, gap: number) => standsFree(x, y, gap, taken)

  for (let attempt = 0; attempt < 500; attempt++) {
    const k = n + attempt * 0.41
    const r = 56 * Math.sqrt(k + 3)
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
 * 소품 한 종류 — 지금은 별사탕 네 빛깔. 큰 상자들은 오브제(DECOR)로 옮겼다.
 */
export type PropKind = { src: string }

export const PROP_KINDS: PropKind[] = [
  { src: '/items/starcandy01.svg' },
  { src: '/items/starcandy02.svg' },
  { src: '/items/starcandy03.svg' },
  { src: '/items/starcandy04.svg' },
]

export type Prop = {
  id: string
  x: number
  y: number
  /** 화면에 보이는 폭(px) */
  w: number
  /** 기울기(도) */
  rot: number
  /** PROP_KINDS 의 몇 번째 그림인지 */
  kind: number
}

/**
 * 별사탕 크기 — 모두 같다.
 * 크기는 오브제 >>>> 모이모 > 별사탕. 모이모 그림은 캔버스의 절반 남짓만
 * 차지하므로(120 이면 몸집 60~70) 별사탕은 그보다 작게 둔다.
 */
export const CANDY_W = 36

/**
 * 처음 화면에 보이는 별사탕 — 시안에 찍힌 자리 그대로다.
 * [x, y, 종류] 이고 종류는 PROP_KINDS 의 순서(0 분홍, 1 하양, 2 파랑, 3 노랑).
 * 유리병·별사탕 상자 그림 안에 이미 그려진 것은 빼고 바닥에 흩어진 것만 옮겼다.
 */
const CANDY_LAYOUT: [number, number, number][] = [
  [1100, 652, 1],
  [1913, 708, 1],
  [2216, 645, 2],
  [2303, 661, 0],
  [1465, 788, 2],
  [1671, 839, 3],
  [1741, 824, 0],
  [2137, 957, 1],
  [2565, 1021, 2],
  [2416, 1119, 3],
  [1075, 1108, 2],
  [1136, 1129, 0],
  [918, 1175, 1],
  [1303, 1195, 3],
  [1399, 1175, 2],
  [1693, 1465, 3],
  [1725, 1451, 2],
  [1940, 1465, 0],
  [1843, 1535, 1],
  [2141, 1539, 0],
  [2076, 1571, 2],
  [1036, 1585, 1],
  [1167, 1565, 2],
  [1153, 1688, 0],
  [1213, 1728, 3],
  [1479, 1791, 2],
  [2000, 1812, 2],
  [2031, 1797, 3],
  [1880, 1844, 1],
  [2423, 1801, 0],
]



/** 시안 바깥에 흩뿌릴 별사탕 수 — 시안 안과 비슷한 밀도가 되게 */
export const PROP_COUNT = 80

/** 기울여 놓으면 네모가 그만큼 커진다. 자리를 잴 때 얹어 준다 */
const ROT_PAD = 1.2

/**
 * 별사탕을 놓는다.
 *
 * 처음 화면 안은 시안대로, 바깥은 시안과 같은 크기·비슷한 밀도로 흩뿌린다.
 * 흩뿌리는 것은 오브제와 시안 네모를 비켜 가고, 서로 넉넉히 떨어진다.
 * 모이모는 이 자리를 피해서 선다.
 */
export function scatterProps(count = PROP_COUNT): Prop[] {
  let s = 19980423
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }

  const w = CANDY_W
  const out: Prop[] = CANDY_LAYOUT.map(([x, y, kind], i) => ({
    id: `candy-${i}`, x, y, w, kind, rot: (rnd() - 0.5) * 30,
  }))

  const free = (x: number, y: number) => {
    if (x < 90 || x > WORLD.w - 90 || y < 110 || y > WORLD.h - 90) return false
    if (x > FRAME.x0 - w && x < FRAME.x1 + w && y > FRAME.y0 - w && y < FRAME.y1 + w) return false
    for (const g of GUARDS) {
      if (Math.abs(x - g.cx) < g.hw + w * 0.75 && Math.abs(y - g.cy) < g.hh + w * 0.75) return false
    }
    for (const p of out) {
      if (Math.abs(x - p.x) < w * 3.6 && Math.abs(y - p.y) < w * 3.6) return false
    }
    return true
  }

  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const x = 90 + rnd() * (WORLD.w - 180)
      const y = 110 + rnd() * (WORLD.h - 200)
      if (!free(x, y)) continue
      out.push({ id: `prop-${i}`, x, y, w, kind: Math.floor(rnd() * PROP_KINDS.length), rot: (rnd() - 0.5) * 30 })
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
  const id = `${Date.now().toString(36)}-${Math.floor(rnd() * 1e6).toString(36)}`
  // 모이모는 좌우를 뒤집지 않는다 — 한쪽에만 있는 무늬·장식이 반대로 가 버린다.
  // 뒤집기에 쓰던 난수는 그대로 뽑아 버린다. 빼면 뒤따르는 값이 밀려
  // 심어 둔 이웃들의 이름과 자리가 통째로 바뀐다
  rnd()
  return {
    id,
    name, genes, x, y,
    phase: rnd(),
    at: Date.now(),
    mine,
    note,
  }
}

/** 처음 온 사람에게도 마을이 비어 보이지 않도록 심어두는 이웃들 */
export function seedResidents(count: number, taken: { x: number; y: number }[] = []): Resident[] {
  let s = 20260914
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  const out: Resident[] = []
  const all = [...taken]
  // 정해 둔 이름을 먼저 넣고 나머지는 지어서 채운 뒤, 골고루 흩어지게 섞는다
  const names = VILLAGERS.slice(0, count)
  while (names.length < count) names.push(randomKoreanName(rnd))
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[names[i], names[j]] = [names[j], names[i]]
  }
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const name = names[i % names.length]
    const genes = genesFromName(name)
    if (!genes) continue
    const spot = scatterSpot(rnd, all)
    if (!spot) break
    const r: Resident = {
      id: `seed-${out.length}`,
      name, genes, x: spot.x, y: spot.y,
      phase: rnd(),
      at: 0,
      mine: false,
    }
    out.push(r)
    all.push(r)
  }
  return out
}

/**
 * 심어 둘 이웃의 자리.
 *
 * 가운데(유리병)로 갈수록 북적이고 가장자리로 갈수록 성기다. 다만 가장자리도
 * 아예 비지는 않게 바닥 밀도(EDGE_DENSITY)를 남겨 둔다 — 마을을 끝까지
 * 줄여 봐도 둘레가 텅 비어 보이지 않게.
 *
 * 마을 아무 데나 뽑고, 가운데서 먼 자리일수록 자주 버린다.
 */
function scatterSpot(rnd: () => number, taken: { x: number; y: number }[]): { x: number; y: number } | null {
  // 모두 같은 간격으로 떨어져 서면 줄 맞춘 것처럼 보인다. 간격을 한 마리씩
  // 다르게 두고, 가끔은 이미 선 이웃 곁에 바짝 붙여 두셋씩 모여 서게 한다
  const gap = MIN_GAP * (0.62 + rnd() * 0.5)
  const huddle = taken.length > 0 && rnd() < HUDDLE
  for (let attempt = 0; attempt < 3000; attempt++) {
    let x: number
    let y: number
    if (huddle && attempt < 60) {
      const t = taken[Math.floor(rnd() * taken.length)]
      const a = rnd() * Math.PI * 2
      const d = MIN_GAP * (0.65 + rnd() * 0.5)
      x = t.x + Math.cos(a) * d * 1.3
      y = t.y + Math.sin(a) * d * 0.7
    } else {
      x = 150 + rnd() * (WORLD.w - 300)
      y = 220 + rnd() * (WORLD.h - 340)
      // 마을 모양대로 납작한 타원 거리 — 0 이 한가운데, 1 이 가장자리
      const r = Math.hypot((x - CENTER.x) / CENTER.x, (y - CENTER.y) / CENTER.y)
      const density = EDGE_DENSITY + (1 - EDGE_DENSITY) * Math.exp(-((r / CROWD_R) ** 2))
      if (rnd() > density) continue
    }
    if (standsFree(x, y, gap, taken)) return { x, y }
  }
  return null
}

/** 이웃 곁에 붙어 서는 비율 — 두셋씩 모인 무리가 생긴다 */
const HUDDLE = 0.3

/** 가장자리에 남겨 둘 밀도 — 한가운데를 1 로 본 값 */
const EDGE_DENSITY = 0.12
/** 북적이는 무리의 반경 — 마을 반폭을 1 로 본 값 */
const CROWD_R = 0.36

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
export function seedCountFor(_vw: number, _vh: number): number {
  return Math.min(MAX_RESIDENTS, SEED_COUNT)
}

/**
 * 저장된 마을을 지금 배치에 맞춘다.
 *
 * 오브제나 별사탕 자리가 바뀌면 예전에 서 있던 모이모가 그 위에 겹친다.
 * 그런 모이모만 빈자리로 옮기고, 나머지는 서 있던 자리를 그대로 지킨다.
 */
function settle(list: Resident[]): Resident[] {
  let s = 20261001
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
  const out: Resident[] = []
  list.forEach((r, i) => {
    if (standsFree(r.x, r.y, MIN_GAP, out)) { out.push(r); return }
    out.push({ ...r, ...spotFor(i, rnd, out) })
  })
  return out
}

export function loadWorld(seeds_ = SEED_COUNT): Resident[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // 예전 형식이 섞여 있어도 쓸 수 있는 것만 살린다
        // 유전자는 이름에서 나오는 것이라 늘 다시 계산한다.
        // 규칙이 바뀌어도 예전에 저장된 모이모가 옛 모습으로 남지 않는다
        const ok = parsed.filter(usable).map((r: Resident) => {
          const g = genesFromName(r.name)
          return g ? { ...r, genes: g } : r
        })
        if (ok.length) {
          // 직접 만든 모이모는 서 있던 자리를 지키고, 심어 둔 이웃은 그
          // 둘레에 새로 흩어 놓는다 — 배치 규칙이 바뀌어도 이웃이 옛 자리에
          // 몰려 있지 않게
          const mine = settle(ok.filter((r: Resident) => r.mine))
          const seeds = seedResidents(seeds_, mine)
          return [...seeds, ...mine]
        }
      }
    }
  } catch {
    /* 저장소를 못 읽어도 마을은 열려야 한다 */
  }
  return seedResidents(seeds_)
}

export function saveWorld(list: Resident[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* 용량 초과 등 */ }
}

export function resetWorld() {
  try { localStorage.removeItem(KEY) } catch { /* noop */ }
}

/**
 * 상한을 넘으면 심어둔 이웃부터 내보낸다.
 * 심어 둔 이웃은 뒤에 심은 쪽부터 비운다.
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
