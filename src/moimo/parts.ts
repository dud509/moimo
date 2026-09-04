/**
 * 파츠 에셋의 단일 진실 공급원.
 * 앵커 편집기와 사이트가 같이 읽는다.
 */

/** 모든 파츠는 이 크기의 정사각 캔버스에 정가운데로 내보낸다 */
export const CANVAS = 512

/* ================================================================== *
 *  색은 여기서 고친다                                                  *
 * ================================================================== */

/** 화면에 그릴 때의 선 색 */
export const LINE_COLOR = '#38312A'

/**
 * 몸통 색깔 — 성 중성.
 *
 *   hex     몸통 전체 색
 *   accent  몸통 안에서 따로 노는 부분의 색 (배·얼굴판 같은 곳)
 *   line    이 몸통일 때만 다르게 쓸 선 색. 없으면 LINE_COLOR
 */
export const BODY_COLORS = [
  { jamo: 'ㅣ', name: '파랑', hex: '#E1EEF4', accent: '#FFFFFF' },
  { jamo: 'ㅏ', name: '노랑', hex: '#FFFAE3', accent: '#FFFFFF' },
  { jamo: 'ㅓ', name: '분홍', hex: '#FFD8E2', accent: '#FFFFFF' },
  { jamo: 'ㅗ', name: '검정', hex: '#231A17', accent: '#FFF4F3', line: '#665546' },
  { jamo: 'ㅜ', name: '흰색', hex: '#FFFFFF', accent: '#FFF4F3' },
  { jamo: 'ㅡㅐㅔㅑㅛㅠ', name: '갈색', hex: '#5F5040', accent: '#FFF4F3' },
] as const

export type BodyColor = (typeof BODY_COLORS)[number]

/** 이 몸통 색일 때 쓸 선 색 */
export const lineFor = (c: BodyColor): string => ('line' in c ? c.line : LINE_COLOR)

/* ================================================================== *
 *  아래는 파츠 원본 파일에 들어 있는 값 — 에셋을 다시 뽑지 않는 한 그대로  *
 * ================================================================== */

/** 원본 SVG 의 선 색 */
export const SOURCE_LINE = '#888989'
/** 원본 SVG 의 채우기 색 */
export const SOURCE_FILL = '#FFFFFF'
/**
 * 원본 SVG 에서 "여기는 몸통 색 말고 따로" 라고 표시해둔 색.
 * 일러스트레이터에서 그 부분만 이 마젠타로 칠해 내보내면,
 * 화면에서는 몸통 색에 맞는 accent 로 바뀐다. 팔레트에 없는 색이라 헷갈리지 않는다.
 */
export const SOURCE_ACCENT = '#FF00FF'
/** 색을 갈아입지 않는 파츠의 채우기 */
export const FILL_COLOR = SOURCE_FILL

export const BODY_COUNT = 12
export const MORPH_COUNT = 5

/** 몸통에 붙는 파츠. z가 작을수록 뒤 */
export type SlotKey = 'tail' | 'deco' | 'cheek' | 'eye' | 'mouth' | 'hair'

export type SlotDef = {
  key: SlotKey
  label: string
  count: number
  z: number
}

export const SLOTS: SlotDef[] = [
  { key: 'tail',  label: '꼬리',     count: 9,  z: 1 },
  { key: 'deco',  label: '몸통장식', count: 6,  z: 4 },
  { key: 'cheek', label: '볼장식',   count: 6,  z: 5 },
  { key: 'eye',   label: '눈',       count: 11, z: 6 },
  { key: 'mouth', label: '입',       count: 9,  z: 6 },
  { key: 'hair',  label: '머리장식', count: 11, z: 7 },
]

/**
 * 흰 채우기를 몸통 색으로 갈아입는 파츠.
 *
 *   'all'   슬롯 전체 — 꼬리는 몸의 일부라 늘 몸통을 따라간다
 *   [번호]  그 번호만 — 눈 11번처럼 흰자가 몸 색이어야 하는 파츠
 *
 * 여기 없는 파츠는 흰색 그대로.
 */
export const TINTED: Partial<Record<SlotKey, 'all' | number[]>> = {
  tail: 'all',
  eye: [11],
}

/** 몸통 색으로 갈아입힐 흰 영역이 정말 있는지 — 없으면 개발 중에 알려준다 */
export function warnIfNothingToTint(slot: SlotKey, part: number, svg: string) {
  if (!isTinted(slot, part)) return
  if (/#ffffff\b|#fff\b|(fill|stroke)="white"|(fill|stroke):\s*white/i.test(svg)) return
  console.warn(
    `[모이모] ${slot} ${String(part).padStart(2, '0')} 은 TINTED 에 적혀 있지만 ` +
    `파일 안에 흰 영역이 없어 몸통 색이 입혀지지 않습니다. ` +
    `일러스트레이터에서 흰자를 #FFFFFF 로 칠해 다시 내보내세요.`,
  )
}

export const isTinted = (slot: SlotKey, part: number): boolean => {
  const rule = TINTED[slot]
  return rule === 'all' || (Array.isArray(rule) && rule.includes(part))
}

/** 이 파츠를 어떤 색으로 채울지 */
export const fillFor = (slot: SlotKey, part: number, bodyHex: string) =>
  isTinted(slot, part) ? bodyHex : FILL_COLOR

/** 몸통 z=2, 무늬 z=3 — 슬롯 사이에 낀다 */
export const Z_BODY = 2
export const Z_MORPH = 3

const pad = (n: number) => String(n).padStart(2, '0')

export const bodyUrl = (n: number) => `/parts/body/${pad(n)}.svg`
export const partUrl = (slot: SlotKey, n: number) => `/parts/${slot}/${pad(n)}.svg`

/**
 * 무늬(morph)는 몸통 모양마다 따로 그린다 — 12 × 5 = 60장.
 * 몸통별 파일을 먼저 찾고, 없으면 공용 파일로 떨어진다.
 */
export const morphUrls = (body: number, morph: number) => [
  `/parts/morph/b${pad(body)}-m${pad(morph)}.svg`,
  `/parts/morph/${pad(morph)}.svg`,
]

/* ---------------- 앵커 ---------------- */

/**
 * s 는 가로 배율, sy 는 세로 배율.
 * sy 를 비워두면 s 를 따라가 가로세로가 같이 늘어난다.
 * 양쪽 귀에 거는 날개처럼 폭만 맞춰야 하는 파츠 때문에 나뉘어 있다.
 */
export type Anchor = { x: number; y: number; s: number; r: number; sy?: number }

/** 세로 배율 — 안 정했으면 가로를 따라간다 */
export const syOf = (a: Anchor) => a.sy ?? a.s

/**
 * 앵커는 네 겹으로 쌓인다. 아래로 갈수록 좁은 범위만 손댄다.
 *
 *   slots      12종 몸통이 함께 쓰는 기준 자리 — "눈은 여기"
 *   bodies     그 몸통에서만 기준에서 얼마나 벗어나는지 — "03 만 조금 위로"
 *   parts      그 번호의 파츠만 — "리본은 더 위에"
 *   overrides  그래도 어색한 한 조합만
 *
 * slots 를 한 번 잡으면 12종이 다 따라오고, 어긋나는 몸통만 bodies 로 살짝
 * 민다. bodies 와 parts 는 기준에 더해지는 보정이라, 값이 비어 있으면 기준 그대로다.
 */
export type AnchorTable = {
  slots: Partial<Record<SlotKey, Anchor>>
  bodies: Record<string, Partial<Record<SlotKey, Anchor>>>
  parts: Partial<Record<SlotKey, Record<string, Anchor>>>
  overrides: Record<string, Anchor>
}

export const DEFAULT_ANCHOR: Anchor = { x: 0, y: 0, s: 1, r: 0 }
export const EMPTY_TABLE: AnchorTable = { slots: {}, bodies: {}, parts: {}, overrides: {} }

export const overrideKey = (body: number, slot: SlotKey, part: number) =>
  `b${String(body).padStart(2, '0')}:${slot}:${String(part).padStart(2, '0')}`

/** 예전에 저장한 모양도 읽어준다 */
export function normalizeTable(raw: unknown): AnchorTable {
  const t = (raw ?? {}) as Record<string, unknown>
  if (t.slots || t.bodies || t.parts || t.overrides) {
    return {
      slots: (t.slots as AnchorTable['slots']) ?? {},
      bodies: (t.bodies as AnchorTable['bodies']) ?? {},
      parts: (t.parts as AnchorTable['parts']) ?? {},
      overrides: (t.overrides as AnchorTable['overrides']) ?? {},
    }
  }
  // 가장 초기 모양 — 몸통별 값만 있던 때
  return { slots: {}, bodies: t as AnchorTable['bodies'], parts: {}, overrides: {} }
}

export const slotAnchor = (t: AnchorTable, slot: SlotKey): Anchor =>
  t.slots[slot] ?? DEFAULT_ANCHOR

export const bodyAnchor = (t: AnchorTable, body: number, slot: SlotKey): Anchor =>
  t.bodies[String(body)]?.[slot] ?? DEFAULT_ANCHOR

export const partAnchor = (t: AnchorTable, slot: SlotKey, part: number): Anchor =>
  t.parts[slot]?.[String(part)] ?? DEFAULT_ANCHOR

/** 기준 위에 몸통 보정과 파츠 보정을 더한다. 예외가 있으면 그게 이긴다 */
export function composeAnchor(t: AnchorTable, body: number, slot: SlotKey, part: number): Anchor {
  const over = t.overrides[overrideKey(body, slot, part)]
  if (over) return over
  const a = slotAnchor(t, slot)
  const b = bodyAnchor(t, body, slot)
  const c = partAnchor(t, slot, part)
  return {
    x: a.x + b.x + c.x,
    y: a.y + b.y + c.y,
    s: a.s * b.s * c.s,
    sy: syOf(a) * syOf(b) * syOf(c),
    r: a.r + b.r + c.r,
  }
}

/**
 * 파츠 SVG 를 화면에 심을 수 있게 손본다.
 *
 * 1. 흰 채우기와 회색 선을 원하는 색으로 바꾼다.
 * 2. id 에 꼬리표를 붙인다 — 한 페이지에 파츠를 수십, 수백 개 심는데
 *    일러스트레이터가 뽑은 id("_몸통", "radial-gradient")가 파일마다 같아서
 *    그대로 두면 그라디언트가 엉뚱한 파츠를 가리킨다.
 */
export type Paint = { fill: string; line: string; accent?: string }

export function prepareSvg(svg: string, paint: Paint, uid: string): string {
  const { fill, line, accent } = paint
  return svg
    // 흰색은 #ffffff, #fff, white 어느 표기로 나와도 잡는다
    .replace(/#ffffff\b/gi, fill)
    .replace(/#fff\b/gi, fill)
    .replace(/\b(fill|stroke)="white"/gi, (_m, a: string) => `${a}="${fill}"`)
    .replace(/\b(fill|stroke):\s*white\b/gi, (_m, a: string) => `${a}:${fill}`)
    // 흰색을 바꾼 뒤에 표시색을 바꾼다 — accent 가 흰색이어도 되도록.
    // 마젠타도 #ff00ff, #f0f, magenta, rgb(255,0,255) 어느 표기로든 나올 수 있다
    .replace(/#ff00ff\b/gi, accent ?? fill)
    .replace(/#f0f\b/gi, accent ?? fill)
    .replace(/\b(fill|stroke)="magenta"/gi, (_m, a: string) => `${a}="${accent ?? fill}"`)
    .replace(/\b(fill|stroke):\s*magenta\b/gi, (_m, a: string) => `${a}:${accent ?? fill}`)
    .replace(/rgb\(\s*255\s*,\s*0\s*,\s*255\s*\)/gi, accent ?? fill)
    .replace(/#888989\b/gi, line)
    .replace(/\bid="([^"]+)"/g, (_m, id: string) => `id="${id}-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${id}-${uid})`)
    .replace(/\b(xlink:href|href)="#([^"]+)"/g, (_m, a: string, id: string) => `${a}="#${id}-${uid}"`)
}
