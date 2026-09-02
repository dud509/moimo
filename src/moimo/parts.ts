/**
 * 파츠 에셋의 단일 진실 공급원.
 * 앵커 편집기와 사이트가 같이 읽는다.
 */

/** 모든 파츠는 이 크기의 정사각 캔버스에 정가운데로 내보낸다 */
export const CANVAS = 512

/** 파츠 원본의 선 색 — 빌드/런타임에 갈아끼운다 */
export const LINE_COLOR = '#888989'
/** 파츠 원본의 채우기 색 */
export const FILL_COLOR = '#FFFFFF'

/** 몸통 색깔 — 성 중성 */
export const BODY_COLORS = [
  { jamo: 'ㅣ', name: '파랑', hex: '#E1EEF4' },
  { jamo: 'ㅏ', name: '노랑', hex: '#FFFAE3' },
  { jamo: 'ㅓ', name: '분홍', hex: '#FFD8E2' },
  { jamo: 'ㅗ', name: '검정', hex: '#231A17' },
  { jamo: 'ㅜ', name: '흰색', hex: '#FFFFFF' },
  { jamo: 'ㅡㅐㅔㅑㅛㅠ', name: '갈색', hex: '#5F5040' },
] as const

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

export type Anchor = { x: number; y: number; s: number; r: number }

/**
 * 앵커는 세 겹으로 쌓인다.
 *
 *   bodies    몸통마다 "이 슬롯은 대체로 여기" — 12 × 6
 *   parts     파츠마다 "나는 기준점에서 이만큼 위" — 슬롯별 파츠 수만큼
 *   overrides 그래도 어색한 조합만 따로
 *
 * 머리 장식처럼 파츠마다 어울리는 자리가 다른 슬롯은 parts 층이 받아준다.
 * 12 × 11 = 132개를 일일이 잡는 대신 12 + 11 = 23개만 잡으면 되고,
 * 남는 몇 개만 overrides 로 손본다.
 */
export type AnchorTable = {
  bodies: Record<string, Partial<Record<SlotKey, Anchor>>>
  parts: Partial<Record<SlotKey, Record<string, Anchor>>>
  overrides: Record<string, Anchor>
}

export const DEFAULT_ANCHOR: Anchor = { x: 0, y: 0, s: 1, r: 0 }
export const EMPTY_TABLE: AnchorTable = { bodies: {}, parts: {}, overrides: {} }

export const overrideKey = (body: number, slot: SlotKey, part: number) =>
  `b${String(body).padStart(2, '0')}:${slot}:${String(part).padStart(2, '0')}`

/** 예전에 저장한 납작한 모양도 읽어준다 */
export function normalizeTable(raw: unknown): AnchorTable {
  const t = (raw ?? {}) as Record<string, unknown>
  if (t.bodies || t.parts || t.overrides) {
    return {
      bodies: (t.bodies as AnchorTable['bodies']) ?? {},
      parts: (t.parts as AnchorTable['parts']) ?? {},
      overrides: (t.overrides as AnchorTable['overrides']) ?? {},
    }
  }
  return { bodies: t as AnchorTable['bodies'], parts: {}, overrides: {} }
}

export const bodyAnchor = (t: AnchorTable, body: number, slot: SlotKey): Anchor =>
  t.bodies[String(body)]?.[slot] ?? DEFAULT_ANCHOR

export const partAnchor = (t: AnchorTable, slot: SlotKey, part: number): Anchor =>
  t.parts[slot]?.[String(part)] ?? DEFAULT_ANCHOR

/** 몸통 기준점 위에 파츠 보정을 얹는다. 예외가 있으면 그게 이긴다 */
export function composeAnchor(t: AnchorTable, body: number, slot: SlotKey, part: number): Anchor {
  const over = t.overrides[overrideKey(body, slot, part)]
  if (over) return over

  const b = bodyAnchor(t, body, slot)
  const p = partAnchor(t, slot, part)
  const rad = (b.r * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: b.x + (p.x * cos - p.y * sin) * b.s,
    y: b.y + (p.x * sin + p.y * cos) * b.s,
    s: b.s * p.s,
    r: b.r + p.r,
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
export function prepareSvg(svg: string, fill: string, line: string, uid: string): string {
  return svg
    .replace(/#FFFFFF|#ffffff|#FFF\b|#fff\b/g, fill)
    .replace(/#888989/gi, line)
    .replace(/\bid="([^"]+)"/g, (_m, id: string) => `id="${id}-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${id}-${uid})`)
    .replace(/\b(xlink:href|href)="#([^"]+)"/g, (_m, a: string, id: string) => `${a}="#${id}-${uid}"`)
}
