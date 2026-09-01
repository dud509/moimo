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
export const PATTERN_COUNT = 5

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
export const Z_PATTERN = 3

const pad = (n: number) => String(n).padStart(2, '0')

export const bodyUrl = (n: number) => `/parts/body/${pad(n)}.svg`
export const partUrl = (slot: SlotKey, n: number) => `/parts/${slot}/${pad(n)}.svg`

/**
 * 무늬는 몸통 모양마다 따로 그릴 수도, 하나를 몸통에 맞춰 쓸 수도 있다.
 * 몸통별 파일을 먼저 찾고 없으면 공용 파일로 떨어진다.
 */
export const patternUrls = (body: number, pattern: number) => [
  `/parts/pattern/b${pad(body)}-p${pad(pattern)}.svg`,
  `/parts/pattern/${pad(pattern)}.svg`,
]

/* ---------------- 앵커 ---------------- */

export type Anchor = { x: number; y: number; s: number; r: number }
export type BodyAnchors = Partial<Record<SlotKey, Anchor>>
/** key: 몸통 번호 */
export type AnchorTable = Record<string, BodyAnchors>

export const DEFAULT_ANCHOR: Anchor = { x: 0, y: 0, s: 1, r: 0 }

export function anchorOf(table: AnchorTable, body: number, slot: SlotKey): Anchor {
  return table[String(body)]?.[slot] ?? DEFAULT_ANCHOR
}

/** 파츠 SVG의 흰 채우기와 회색 선을 원하는 색으로 */
export function recolor(svg: string, fill: string, line: string): string {
  return svg
    .replace(/#FFFFFF|#ffffff|#FFF\b|#fff\b/g, fill)
    .replace(/#888989|#888/gi, line)
}
