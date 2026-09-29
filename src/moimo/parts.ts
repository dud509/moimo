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
 *   accent  귀 안쪽 색 — 몸통 파일에 마젠타로 칠해 둔 자리. 무늬가 있든 없든
 *           이 색을 쓴다. 파랑·노랑은 분홍, 나머지는 흰색
 *   line    이 몸통일 때만 다르게 쓸 선 색. 없으면 LINE_COLOR
 *   deep    누름 쪽일 때 무늬에 쓸 색. 색마다 눈으로 골라 둔 값이다.
 *           진갈색만 짙은 쪽이 없어서 — 더 눌러 봤자 까매진다 — 분홍과 짝지었다
 *   point   몸통 장식에 쓸 색. 몸통 색과 같으면 장식이 파묻히므로
 *           색마다 어울리는 짝을 따로 정해 둔다
 *   noFlip  누름 쪽이어도 뒤집지 않는다. 진갈색은 몸이 제 색을 입으면
 *           너무 무거워서, 흰 바탕 자리에 deep 을 깔고 무늬는 제 색으로 둔다
 */
export const BODY_COLORS = [
  { jamo: 'ㅣ받침', name: '파랑', hex: '#E6F0F4', accent: '#FCE6E9', deep: '#CAE0E5', point: '#F9DEE6' },
  { jamo: 'ㅏ', name: '노랑', hex: '#FFFAE3', accent: '#FCE6E9', deep: '#FFF2BB', point: '#DDD6EA' },
  { jamo: 'ㅓ', name: '분홍', hex: '#FFF0F4', accent: '#FFFFFF', deep: '#F9DEE6', point: '#CAE0E5' },
  { jamo: 'ㅗㅜ', name: '진갈색', hex: '#665040', accent: '#FFFFFF', deep: '#FFF0F4', noFlip: true, point: '#f9dee6' },
  { jamo: 'ㅣ', name: '민트', hex: '#E9F4EC', accent: '#FFFFFF', deep: '#D1E8D7', point: '#665040' },
  { jamo: '나머지', name: '연보라', hex: '#ECE7F2', accent: '#FFFFFF', deep: '#DDD6EA', point: '#FFF2BB' },
] as const

export type BodyColor = (typeof BODY_COLORS)[number]

/** 이 몸통 색의 짙은 쪽 — 무늬를 진하게 넣을 때 쓴다 */
export const deepFor = (c: BodyColor): string => c.deep

/** 이 몸통 색일 때 쓸 선 색. 적어 두지 않으면 모두 같은 선 색을 쓴다 */
export const lineFor = (c: BodyColor): string =>
  'line' in c ? (c as { line: string }).line : LINE_COLOR

/**
 * 이 몸통 색일 때 무늬와 귀를 칠할 색.
 *
 * 이름이 정한 색 그대로다. 몸 전체를 칠할 때와 무늬로 갈 때가 같은 색이라야
 * 「파랑」이 두 가지 파랑으로 갈라지지 않는다.
 */
export const markFor = (c: BodyColor): string => c.hex

/** 무늬가 없을 때만 쓰는 흰 바탕 */
const PLAIN_WHITE = '#FFFFFF'

/**
 * 뒤집지 않는 무늬.
 *
 * 무늬 파일은 «칠할 데만 그린 그림» 일 수도, «넓게 칠하고 비울 데를 파낸
 * 그림» 일 수도 있다. 뒤엣것에 누름 쪽의 뒤집기를 또 걸면 두 번 뒤집혀
 * 몸이 통째로 짙은 색이 된다. 그런 무늬는 여기 적어 뒤집기를 건너뛴다 —
 * 흰 바탕 자리에만 짙은 쪽을 깔고 무늬는 제 색으로 둔다.
 */
export const MORPH_HOLD = new Set<number>([2])

/**
 * 이 몸통 색과 무늬로 어떤 색들을 쓸지.
 *
 * 무늬가 없으면 이름이 정한 색이 몸 전체를 칠한다. 무늬가 있으면 바탕은
 * 희게 두고 그 색은 무늬로 간다. 한 마리가 두 색을 갖지 않게 하려는 것이다.
 *
 * 이름이 «누름» 쪽이면(tone) 그 둘을 뒤집는다 — 몸이 이름 색을 그대로 입고
 * 무늬 자리에 짙은 쪽 색이 앉는다. 같은 무늬라도 흰 바탕에 연하게 앉은 것과
 * 제 색 위에 진하게 앉은 것이 따로 있게 된다.
 *
 * 어디를 칠하고 어디를 비울지는 무늬 파일이 정한다 — 칠할 데만 그린 무늬도
 * 있고, 넓게 칠해 두고 비울 데를 파낸 무늬도 있다. 코드는 둘을 구별하지
 * 않는다.
 */
export function toneFor(c: BodyColor, morph: number, tone = 0) {
  const plain = morph === 0
  const deep = !plain && tone === 1
  // 뒤집지 않는 색·무늬는 무늬를 제 색으로 두고 흰 바탕 자리만 짙은 쪽으로 깐다
  const held = deep && ('noFlip' in c || MORPH_HOLD.has(morph))
  // 무늬가 없거나 뒤집은 쪽이면 몸이 이름 색을 그대로 입는다
  const dressed = plain || (deep && !held)
  return {
    fill: dressed ? c.hex : held ? deepFor(c) : PLAIN_WHITE,
    line: dressed ? lineFor(c) : LINE_COLOR,
    accent: c.accent,
    mark: deep && !held ? deepFor(c) : markFor(c),
  }
}

/* ================================================================== *
 *  아래는 파츠 원본 파일에 들어 있는 값 — 에셋을 다시 뽑지 않는 한 그대로  *
 * ================================================================== */

/** 원본 SVG 의 선 색 */
export const SOURCE_LINE = '#888989'

/**
 * 이 색이 선인가.
 *
 * 원본은 #888989 로 맞춰 두었지만 일러스트에서 다시 뽑다 보면 #898989
 * 처럼 한 자리씩 어긋난다. 그러면 선 색이 안 바뀌어 몸통 하나만 흐리게
 * 떠 버린다. 그래서 딱 그 값이 아니라 «회색 언저리» 를 다 선으로 본다 —
 * 세 채널이 서로 비슷하고 밝기가 중간쯤인 색.
 */
export function isLineGrey(hex: string): boolean {
  const n = parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const lo = Math.min(r, g, b)
  const hi = Math.max(r, g, b)
  return hi - lo <= 12 && lo >= 0x78 && hi <= 0xa0
}
/** 원본 SVG 의 채우기 색 */
export const SOURCE_FILL = '#FFFFFF'
/**
 * 원본 SVG 에서 "여기는 몸통 색 말고 따로" 라고 표시해둔 색.
 * 일러스트레이터에서 그 부분만 이 마젠타로 칠해 내보내면,
 * 화면에서는 몸통 색에 맞는 accent 로 바뀐다. 팔레트에 없는 색이라 헷갈리지 않는다.
 */
export const SOURCE_ACCENT = '#FF00FF'

/**
 * 몸통 파일에 «부위» 를 표시해 두는 색.
 *
 * 귀처럼 몸통마다 자리가 다른 자리는 무늬 한 장으로 칠할 수 없다.
 * 그래서 몸통 파일 안에서 그 부위를 눈에 띄는 색으로 칠해 표시해 둔다.
 * 일러스트레이터는 이 색들을 `lime`, `aqua`, `yellow` 로 적어 내보내기도 한다.
 * 평소에는 몸통 색으로 덮어 없는 것처럼 두고, 그 무늬일 때만 칠한다.
 *
 * 귀가 둘인 것은 한 몸통에서 무늬마다 다른 자리를 칠하고 싶을 때가 있어서다.
 * 라임으로 한 벌, 노랑으로 또 한 벌 표시해 두고 무늬별로 골라 쓴다.
 */
export const MARKS = {
  귀: /fill="(#00ff00|#0f0|lime)"/i,
  귀2: /fill="(#ffff00|#ff0|yellow)"/i,
} as const

/** 무늬 파일에서 «칠할 자리» 로 표시해 둔 색 */
export const MORPH_MARK = /#00ffff\b|#0ff\b|\b(fill|stroke)="(aqua|cyan)"/i

export type RegionPart = keyof typeof MARKS
export type RegionSpec = { 부위: RegionPart; 쪽?: '왼' | '오' }
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
  deco: [1, 3, 4, 5],   // 02·06 은 제 색을 그대로 쓴다
  hair: [4, 5],
}

/**
 * 몸통 색 대신 포인트 색(point)을 입는 파츠.
 * 몸 위에 얹히는 장식은 몸통 색이면 파묻히므로 몸통 장식과 같은 짝 색을 쓴다.
 * TINTED 에도 적혀 있어야 칠해진다.
 */
const POINTED: Partial<Record<SlotKey, 'all' | number[]>> = {
  deco: 'all',
  hair: [4, 5],
}

export const usesPoint = (slot: SlotKey, part: number): boolean => {
  const rule = POINTED[slot]
  return rule === 'all' || (Array.isArray(rule) && rule.includes(part))
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

/**
 * 몸통 장식(과 POINTED 에 적힌 파츠)에 쓸 색.
 *
 * 몸통 색을 그대로 쓰면 장식이 몸에 파묻힌다. 색마다 어울리는 짝을
 * 정해 두고 그것을 쓴다 — 무늬가 있든 없든, 뒤집었든 아니든 한 색이다.
 */
export const decoFor = (c: BodyColor): string => c.point

/** 이 파츠를 어떤 색으로 채울지 */
export const fillFor = (slot: SlotKey, part: number, bodyHex: string) =>
  isTinted(slot, part) ? bodyHex : FILL_COLOR

/** 몸통 z=2, 무늬 z=3 — 슬롯 사이에 낀다 */
/**
 * 그림 파일 없이 몸통에 표시해 둔 부위를 그대로 칠하는 무늬.
 *
 * 귀는 몸통마다 자리와 모양이 달라 무늬 한 장으로 덮을 수 없다. 대신
 * 몸통 파일에 표시해 둔 귀 영역을 칠한다. 표시가 없는 몸통은 예전처럼
 * 무늬 파일을 쓴다.
 */
/**
 * 무늬마다 «몸통 파일의 어느 표시를 칠할지» 를 적는다.
 * 쪽을 적으면 캔버스 한가운데를 기준으로 반만, 안 적으면 양쪽 다 칠한다.
 * 여기에 적히지 않아도 그 무늬의 무늬 파일은 늘 함께 그려진다.
 */
/**
 * 무늬가 몸통의 «바깥» 까지 덮는 무늬들.
 *
 * 꼬리는 몸통에 이어 붙은 것이라 몸통 바깥이 무늬 색으로 덮이면 꼬리만
 * 몸통 색으로 남아 동떨어져 보인다. 이 무늬일 때는 꼬리도 함께 칠한다.
 */
export const MORPH_TAIL = new Set<number>([1, 2, 3, 5])

/**
 * 무늬 가장자리를 어떻게 마감할지.
 *
 * `line` 은 몸통과 같은 선으로 테두리를 두른다. `soft` 는 가장자리를 흐려
 * 에어브러시처럼 번지게 한다. `flat` 은 아무것도 하지 않는다.
 */
export const MORPH_EDGE: 'line' | 'soft' | 'fade' | 'flat' = 'flat'

/**
 * `fade` — 위에서 아래로 흐르는 세로 그라데이션.
 *
 * 귀 끝은 꽉 찬 색이고 뿌리로 내려오며 사라진다. 덩어리마다 제 높이를
 * 기준으로 삼으므로 귀가 길든 짧든 같은 비율로 풀린다.
 * 0 이 덩어리의 맨 위, 1 이 맨 아래다.
 */
export const FADE_HOLD = 0.45   // 여기까지는 색이 꽉 차 있다
export const FADE_END = 1.0     // 여기서 완전히 사라진다
/** `soft` 일 때 번지는 정도 */
export const MORPH_BLUR = 20

/**
 * 번지기 전에 모양을 얼마나 키울지.
 *
 * 그냥 흐리면 덩어리 전체가 뿌예진다. 먼저 키워 두면 가운데는 꽉 찬 색으로
 * 남고 가장자리에서만 풀린다. 바깥쪽으로 새는 몫은 실루엣이 잘라 낸다.
 */
export const MORPH_SPREAD = 16

/**
 * 번지기는 귀와 얼굴에서만 한다.
 *
 * 몸통과 팔다리에서 번지면 옷에 얼룩이 진 것처럼 보인다. 이 높이 아래는
 * 번지지 않고 또렷하게 그린다. 열두 몸통 모두 몸통통이 y=307 에서 시작한다.
 */
export const HEAD_BOTTOM = 304
/** 몸통 쪽 무늬의 가장자리 마감 */
export const MORPH_BODY_EDGE: 'line' | 'soft' | 'fade' | 'flat' = 'line'

/**
 * 이 몸통 색에서 무늬 가장자리를 어떻게 마감할지.
 *
 * 어두운 색은 번지게 두면 흰 바탕으로 흘러들어 때 탄 것처럼 보인다.
 * 그 줄에 `edge: 'line'` 을 붙이면 그 색만 선으로 두른다.
 */
export const edgeFor = (c: BodyColor): 'line' | 'soft' | 'fade' | 'flat' =>
  'edge' in c ? (c as { edge: 'line' }).edge : MORPH_EDGE

export const REGION_MORPH: Record<number, RegionSpec[]> = {
  1: [{ 부위: '귀' }],                 // 귀 양쪽 + 무늬 파일
  2: [],                               // 무늬 파일만. 색을 뒤집어 흰 무늬로 판다
  3: [],                               // 무늬 파일만
  4: [{ 부위: '귀', 쪽: '왼' }],       // 왼쪽 귀 + 무늬 파일
  5: [{ 부위: '귀' }],                 // 귀 양쪽 + 무늬 파일
  // 받침이 없으면 무늬 0 — 아무것도 그리지 않는다
}

/**
 * 몸통마다 따로 정하는 규칙.
 *
 * 위 표는 열두 몸통에 똑같이 적용된다. 그런데 몸통에 따라 귀 모양이 달라
 * 어떤 무늬에서는 칠하지 않는 편이 나을 때가 있다. 여기 적어 둔 몸통은
 * 그 무늬에서만 위 표 대신 이것을 쓴다 — 적지 않은 무늬는 위 표 그대로다.
 */
export const REGION_BODY: Record<number, Record<number, RegionSpec[]>> = {
  // 몸통 04 는 귀가 얼굴 위로 접혀 내려와, 무늬 3 이 얼굴 자리를 비울 때
  // 귀까지 뚫린다. 귀를 무늬 위로 한 번 더 칠해 메운다
  4: {
    3: [{ 부위: '귀' }],
  },
  // 몸통 07 은 무늬 1·4 에서만, 그것도 노랑으로 따로 표시해 둔 자리를 칠한다
  7: {
    1: [{ 부위: '귀2' }],
    4: [{ 부위: '귀2' }],
    5: [],
  },
}

/** 이 몸통·이 무늬에서 칠할 부위 */
export const regionsFor = (body: number | undefined, morph: number): RegionSpec[] =>
  (body !== undefined ? REGION_BODY[body]?.[morph] : undefined) ?? REGION_MORPH[morph] ?? []

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
export type Anchor = {
  x: number; y: number; s: number; r: number
  sy?: number
  /**
   * 좌우 벌림. 파츠를 한가운데서 갈라 양쪽으로 이 값만큼 밀어낸다.
   * 양쪽 귀에 거는 날개처럼, 늘리면 찌부되고 폭만 넓혀야 하는 파츠를 위한 것.
   */
  spread?: number
}

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
    spread: (a.spread ?? 0) + (b.spread ?? 0) + (c.spread ?? 0),
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
export type Paint = { fill: string; line: string; accent?: string; ear?: string; morph?: string }

/**
 * 받아온 것이 정말 SVG 인지.
 *
 * 개발 서버는 없는 파일을 요청하면 404 가 아니라 index.html 을 200 으로 준다.
 * "<" 로 시작하는지만 보면 그 HTML 을 파츠로 알고 집어넣게 된다.
 */
export function isSvgText(text: string): boolean {
  return /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE\s+svg[^>]*>\s*)?<svg[\s>]/i.test(text)
}

export function prepareSvg(svg: string, paint: Paint, uid: string): string {
  const { fill, line, accent } = paint
  const ear = paint.ear ?? fill
  const morph = paint.morph ?? fill
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
    // 표시색 — 칠할 일이 없으면 몸통 색으로 덮어 없는 것처럼 둔다.
    // 라임과 노랑은 귀 면적, 아쿠아는 무늬 자리다
    .replace(/#00ff00\b|#0f0\b|#ffff00\b|#ff0\b/gi, ear)
    .replace(/\b(fill|stroke)="(lime|yellow)"/gi, (_m, a: string) => `${a}="${ear}"`)
    .replace(/\b(fill|stroke):\s*(lime|yellow)\b/gi, (_m, a: string) => `${a}:${ear}`)
    .replace(/#00ffff\b|#0ff\b/gi, morph)
    .replace(/\b(fill|stroke)="(aqua|cyan)"/gi, (_m, a: string) => `${a}="${morph}"`)
    .replace(/\b(fill|stroke):\s*(aqua|cyan)\b/gi, (_m, a: string) => `${a}:${morph}`)
    .replace(/#([0-9a-f]{6})\b/gi, (m: string, hex: string) => (isLineGrey(hex) ? line : m))
    // 선 꺾이는 곳은 언제나 둥글게. 손으로 그린 선은 아주 짧은 마디에서 방향이
    // 홱 꺾이는 데가 있어, 뾰족하게 이으면 그 자리로 가시가 삐져나온다.
    // 파일에 넣어 둬도 일러스트에서 다시 내보내면 빠지므로 여기서 건다
    .replace(/stroke-linejoin(="|:\s*)[a-z-]+/gi, 'stroke-linejoin$1round')
    .replace(/<(path|polyline|polygon|line|circle|ellipse|rect)\b(?![^>]*stroke-linejoin)([^>]*\bstroke=)/gi, '<$1 stroke-linejoin="round"$2')
    .replace(/\bid="([^"]+)"/g, (_m, id: string) => `id="${id}-${uid}"`)
    .replace(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${id}-${uid})`)
    .replace(/\b(xlink:href|href)="#([^"]+)"/g, (_m, a: string, id: string) => `${a}="#${id}-${uid}"`)
}
