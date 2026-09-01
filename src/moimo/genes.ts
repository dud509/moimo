/**
 * 모이모의 유전자.
 * 모든 모이모는 아래 9개 슬롯의 조합 하나로 완전히 결정된다.
 * 슬롯 개수를 곱한 값이 곧 "존재할 수 있는 모이모의 수"다.
 */

export type Genes = {
  body: number
  color: number
  pattern: number
  eyes: number
  mouth: number
  blush: number
  head: number
  hold: number
  size: number
}

export type GeneKey = keyof Genes

/* ------------------------------------------------------------------ */
/* 몸                                                                  */
/* ------------------------------------------------------------------ */

export type BodyDef = {
  name: string
  path: string
  /** 얼굴 중심 */
  face: [number, number]
  /** 머리 장식이 붙는 정수리 */
  top: [number, number]
  /** 발이 닿는 바닥 */
  footY: number
  /** 손에 든 물건이 놓이는 위치 */
  hand: [number, number]
}

export const BODIES: BodyDef[] = [
  {
    name: '동글',
    path: 'M50 30C68 30 78 44 78 60C78 78 66 88 50 88C34 88 22 78 22 60C22 44 32 30 50 30Z',
    face: [50, 58], top: [50, 30], footY: 88, hand: [79, 72],
  },
  {
    name: '길쭉',
    path: 'M50 24C66 24 74 40 74 60C74 79 64 90 50 90C36 90 26 79 26 60C26 40 34 24 50 24Z',
    face: [50, 54], top: [50, 24], footY: 90, hand: [75, 74],
  },
  {
    name: '납작',
    path: 'M50 40C74 40 86 50 86 64C86 79 72 88 50 88C28 88 14 79 14 64C14 50 26 40 50 40Z',
    face: [50, 63], top: [50, 40], footY: 88, hand: [86, 74],
  },
  {
    name: '물방울',
    path: 'M50 24C58 42 78 48 78 64C78 79 66 89 50 89C34 89 22 79 22 64C22 48 42 42 50 24Z',
    face: [50, 63], top: [50, 26], footY: 89, hand: [79, 76],
  },
  {
    name: '구름',
    path: 'M32 46C32 34 44 28 52 34C60 26 74 32 74 44C82 46 84 58 78 66C80 78 68 88 54 86C44 92 30 88 28 76C18 72 20 52 32 46Z',
    face: [51, 60], top: [52, 30], footY: 88, hand: [80, 74],
  },
  {
    name: '네모',
    path: 'M32 32H68A14 14 0 0 1 82 46V72A14 14 0 0 1 68 86H32A14 14 0 0 1 18 72V46A14 14 0 0 1 32 32Z',
    face: [50, 58], top: [50, 32], footY: 86, hand: [83, 72],
  },
  {
    name: '별젤리',
    path: 'M50 26Q58 44 76 42Q68 58 80 74Q62 74 54 90Q44 76 26 78Q32 60 20 48Q40 46 50 26Z',
    face: [50, 60], top: [50, 28], footY: 88, hand: [80, 74],
  },
  {
    name: '하트',
    path: 'M50 34C56 22 76 24 78 40C80 58 62 74 50 88C38 74 20 58 22 40C24 24 44 22 50 34Z',
    face: [50, 52], top: [50, 30], footY: 88, hand: [76, 66],
  },
]

/* ------------------------------------------------------------------ */
/* 색                                                                  */
/* ------------------------------------------------------------------ */

export type ColorDef = { name: string; fill: string; line: string; shade: string }

export const COLORS: ColorDef[] = [
  { name: '크림',   fill: '#FFF3DC', line: '#C9A46A', shade: '#F6E2BE' },
  { name: '복숭아', fill: '#FFD9D2', line: '#D98878', shade: '#FFC2B6' },
  { name: '딸기',   fill: '#FFB3C4', line: '#D45F80', shade: '#FF97AF' },
  { name: '자두',   fill: '#E8B7E4', line: '#A96BA8', shade: '#DBA0D6' },
  { name: '라벤더', fill: '#CFC6F5', line: '#7C6FC4', shade: '#BBAFF0' },
  { name: '하늘',   fill: '#BFE0F8', line: '#5C93BE', shade: '#A6D2F3' },
  { name: '바다',   fill: '#A9D9DA', line: '#4C8F91', shade: '#8FCCCE' },
  { name: '새싹',   fill: '#CBE8B4', line: '#6E9C55', shade: '#B6DE9A' },
  { name: '올리브', fill: '#DDE3AE', line: '#8B9250', shade: '#CDD693' },
  { name: '레몬',   fill: '#FFEBA6', line: '#C9A63C', shade: '#FFE083' },
  { name: '살구',   fill: '#FFCE9E', line: '#CE8846', shade: '#FFBB7C' },
  { name: '코코아', fill: '#DFC0A4', line: '#94664A', shade: '#D0AB8A' },
  { name: '재',     fill: '#DCDCE2', line: '#7B7B87', shade: '#C9C9D2' },
  { name: '먹',     fill: '#8E8B9B', line: '#4A4757', shade: '#7A7787' },
  { name: '눈',     fill: '#FFFFFF', line: '#A9A9B8', shade: '#F0F0F5' },
  { name: '민트',   fill: '#C4F0DC', line: '#4E9E7B', shade: '#A8E7C9' },
]

/* ------------------------------------------------------------------ */
/* 나머지 슬롯 이름표 (렌더링은 Moimo.tsx)                              */
/* ------------------------------------------------------------------ */

export const PATTERNS = ['민무늬', '점박이', '줄무늬', '배', '하트점', '별점', '체크', '노을'] as const
export const EYES = ['점', '반짝', '감은', '웃는', '큰눈', '졸린', '별', '하트', '점선', '테두리', '놀란', '삐뚠'] as const
export const MOUTHS = ['작은점', '냐', '방긋', '동그란', '삼', '일자', '삐죽', '함박', '메롱', '물결'] as const
export const BLUSHES = ['없음', '동그란볼', '사선볼', '하트볼'] as const
export const HEADS = ['없음', '새싹', '뿔', '고양이귀', '토끼귀', '리본', '별', '안테나', '왕관', '베레모', '꽃', '구름', '뿔하나', '하트'] as const
export const HOLDS = ['없음', '풍선', '나뭇잎', '컵', '우산', '별막대', '가방', '책', '사탕', '꽃', '깃발', '도넛'] as const
export const SIZES = ['꼬마', '보통', '큰'] as const
export const SIZE_SCALE = [0.78, 1, 1.24]

/* ------------------------------------------------------------------ */
/* 슬롯 메타                                                            */
/* ------------------------------------------------------------------ */

export type SlotMeta = { key: GeneKey; label: string; options: readonly string[] }

export const SLOTS: SlotMeta[] = [
  { key: 'body',    label: '몸',   options: BODIES.map((b) => b.name) },
  { key: 'color',   label: '색',   options: COLORS.map((c) => c.name) },
  { key: 'pattern', label: '무늬', options: PATTERNS },
  { key: 'eyes',    label: '눈',   options: EYES },
  { key: 'mouth',   label: '입',   options: MOUTHS },
  { key: 'blush',   label: '볼',   options: BLUSHES },
  { key: 'head',    label: '머리', options: HEADS },
  { key: 'hold',    label: '소품', options: HOLDS },
  { key: 'size',    label: '크기', options: SIZES },
]

/** 존재할 수 있는 모이모의 총 개수 */
export const TOTAL_COMBINATIONS = SLOTS.reduce((n, s) => n * s.options.length, 1)

/* ------------------------------------------------------------------ */
/* 난수 / 생성 / 인코딩                                                 */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomGenes(rnd: () => number = Math.random): Genes {
  const pick = (n: number) => Math.floor(rnd() * n)
  return {
    body: pick(BODIES.length),
    color: pick(COLORS.length),
    pattern: pick(PATTERNS.length),
    eyes: pick(EYES.length),
    mouth: pick(MOUTHS.length),
    blush: pick(BLUSHES.length),
    head: pick(HEADS.length),
    hold: pick(HOLDS.length),
    size: pick(SIZES.length),
  }
}

/** 유전자를 사람이 옮겨 적을 수 있는 짧은 코드로 */
export function encodeGenes(g: Genes): string {
  return SLOTS.map((s) => g[s.key].toString(36).toUpperCase()).join('')
}

export function decodeGenes(code: string): Genes | null {
  if (code.length !== SLOTS.length) return null
  const g = {} as Genes
  for (let i = 0; i < SLOTS.length; i++) {
    const v = parseInt(code[i], 36)
    if (Number.isNaN(v) || v >= SLOTS[i].options.length) return null
    g[SLOTS[i].key] = v
  }
  return g
}

/** 유전자를 한 줄로 읽어주기 — "라벤더 구름 몸에 별눈" */
export function describeGenes(g: Genes): string {
  const head = HEADS[g.head] === '없음' ? '' : `${HEADS[g.head]} 달린 `
  const hold = HOLDS[g.hold] === '없음' ? '' : `, ${HOLDS[g.hold]}을(를) 든`
  return `${COLORS[g.color].name}빛 ${BODIES[g.body].name} 몸에 ${EYES[g.eyes]}눈, ${head}${SIZES[g.size]} 모이모${hold}`
}

/* ------------------------------------------------------------------ */
/* 이름                                                                */
/* ------------------------------------------------------------------ */

const NAME_HEAD = ['뽀', '몽', '콩', '도', '미', '루', '초', '방', '두', '나', '소', '하', '리', '포', '쿠', '삐']
const NAME_TAIL = ['리', '롱', '미', '니', '코', '삐', '순', '쿠', '다', '요', '뭉', '봉', '지', '우', '링', '토']

export function randomName(rnd: () => number = Math.random): string {
  const h = NAME_HEAD[Math.floor(rnd() * NAME_HEAD.length)]
  const t = NAME_TAIL[Math.floor(rnd() * NAME_TAIL.length)]
  return h + t
}
