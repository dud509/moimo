/**
 * 이름 → 모이모.
 *
 * 성의 초성·중성·종성이 몸통·색·무늬를,
 * 이름 첫 글자가 눈·입·볼을,
 * 이름 둘째 글자가 머리장식·꼬리·몸통장식을 정한다.
 * 같은 이름은 언제나 같은 모이모가 된다.
 */

import { cleanName, decompose, type Syllable } from './hangul'

export type MoimoGenes = {
  body: number     // 1..12
  color: number    // 1..6
  pattern: number  // 0..5  (0 = 무늬 없음)
  eye: number      // 1..11
  mouth: number    // 1..9
  cheek: number    // 1..6
  hair: number     // 1..11
  tail: number     // 1..9
  deco: number     // 1..6
}

/* ------------------------------------------------------------------ */
/* 성                                                                  */
/* ------------------------------------------------------------------ */

/** 두 글자 성. 이름이 세 글자 이상일 때만 본다 */
const COMPOUND_SURNAMES = [
  '남궁', '황보', '제갈', '사공', '선우', '서문', '독고', '동방',
  '강전', '어금', '장곡', '소봉', '즙문', '망절',
]

export type NameParts = {
  /** 정리된 전체 이름 */
  full: string
  surname: string
  given: string
  /** 성 첫 글자 */
  s: Syllable
  /** 이름 첫 글자 */
  n1: Syllable
  /** 이름 둘째 글자 — 외자 이름이면 n1을 한 번 더 읽는다 */
  n2: Syllable
  /** 외자 이름이라 n2를 메아리로 채웠는지 */
  echoed: boolean
}

export function splitName(raw: string): NameParts | null {
  const full = cleanName(raw)
  if (full.length < 2) return null

  const compound = full.length >= 3 && COMPOUND_SURNAMES.includes(full.slice(0, 2))
  const surname = compound ? full.slice(0, 2) : full.slice(0, 1)
  const given = full.slice(surname.length)
  if (!given.length) return null

  const s = decompose(surname[0])!
  const n1 = decompose(given[0])!
  // 이름이 세 글자 이상이면 첫 글자와 마지막 글자를 읽는다
  const echoed = given.length < 2
  const n2 = echoed ? n1 : decompose(given[given.length - 1])!

  return { full, surname, given, s, n1, n2, echoed }
}

/* ------------------------------------------------------------------ */
/* 자모 → 파츠 번호                                                     */
/* ------------------------------------------------------------------ */

const pick = (map: Record<string, number>, jamo: string, fallback: number) =>
  map[jamo] ?? fallback

/** 몸통 — 성 초성. 김·이·박은 성 전체를 먼저 본다 */
const BODY_BY_CHO: Record<string, number> = {
  ㄱ: 4, ㄴ: 5, ㅂ: 6, ㅅ: 7, ㅇ: 8, ㅈ: 9, ㅊ: 10, ㅎ: 11,
}
const BODY_SPECIAL: Record<string, number> = { 김: 1, 이: 2, 박: 3 }

/** 몸통 색깔 — 성 중성 */
const COLOR_BY_JUNG: Record<string, number> = { ㅣ: 1, ㅏ: 2, ㅓ: 3, ㅗ: 4, ㅜ: 5 }

/** 몸통 무늬 — 성 종성. 받침 없으면 무늬 없음 */
const PATTERN_BY_JONG: Record<string, number> = { '': 0, ㄱ: 1, ㄴ: 2, ㅁ: 3, ㅇ: 4 }

/** 눈·머리장식 — 초성 */
const CONSONANT_11: Record<string, number> = {
  ㄱ: 1, ㄴ: 2, ㄷ: 3, ㄹ: 4, ㅁ: 5, ㅂ: 6, ㅅ: 7, ㅇ: 8, ㅈ: 9, ㅎ: 10,
}

/** 입·꼬리 — 중성 */
const VOWEL_9: Record<string, number> = {
  ㅏ: 1, ㅓ: 2, ㅕ: 3, ㅗ: 4, ㅜ: 5, ㅡ: 6, ㅣ: 7,
  ㅐ: 8, ㅔ: 8, ㅒ: 8, ㅖ: 8,
}

/** 볼장식·몸통장식 — 종성. 받침 없음도 그림이 따로 있다 */
const JONG_6: Record<string, number> = { ㄱ: 1, ㄴ: 2, ㅇ: 3, ㅁ: 4, '': 5 }

/* ------------------------------------------------------------------ */
/* 조립                                                                */
/* ------------------------------------------------------------------ */

export function genesFromParts(p: NameParts): MoimoGenes {
  return {
    body: BODY_SPECIAL[p.surname] ?? pick(BODY_BY_CHO, p.s.cho, 12),
    color: pick(COLOR_BY_JUNG, p.s.jung, 6),
    pattern: pick(PATTERN_BY_JONG, p.s.jong, 5),
    eye: pick(CONSONANT_11, p.n1.cho, 11),
    mouth: pick(VOWEL_9, p.n1.jung, 9),
    cheek: pick(JONG_6, p.n1.jong, 6),
    hair: pick(CONSONANT_11, p.n2.cho, 11),
    tail: pick(VOWEL_9, p.n2.jung, 9),
    deco: pick(JONG_6, p.n2.jong, 6),
  }
}

/** 이름 한 줄이면 모이모 하나. 한글 이름이 아니면 null */
export function genesFromName(raw: string): MoimoGenes | null {
  const parts = splitName(raw)
  return parts ? genesFromParts(parts) : null
}

/* ------------------------------------------------------------------ */
/* 왜 이렇게 생겼는지                                                   */
/* ------------------------------------------------------------------ */

export type Reason = {
  slot: keyof MoimoGenes
  label: string
  /** 어느 글자에서 왔는지 */
  from: string
  /** 그 글자의 어느 자리인지 */
  place: '초성' | '중성' | '종성'
  jamo: string
  value: number
}

const READOUT: Array<{
  slot: keyof MoimoGenes; label: string; src: 's' | 'n1' | 'n2'; place: '초성' | '중성' | '종성'
}> = [
  { slot: 'body',    label: '몸통',     src: 's',  place: '초성' },
  { slot: 'color',   label: '몸통 색깔', src: 's',  place: '중성' },
  { slot: 'pattern', label: '몸통 무늬', src: 's',  place: '종성' },
  { slot: 'eye',     label: '눈',       src: 'n1', place: '초성' },
  { slot: 'mouth',   label: '입',       src: 'n1', place: '중성' },
  { slot: 'cheek',   label: '볼 장식',  src: 'n1', place: '종성' },
  { slot: 'hair',    label: '머리 장식', src: 'n2', place: '초성' },
  { slot: 'tail',    label: '꼬리',     src: 'n2', place: '중성' },
  { slot: 'deco',    label: '몸통 장식', src: 'n2', place: '종성' },
]

const JAMO_KEY = { 초성: 'cho', 중성: 'jung', 종성: 'jong' } as const

/** 전시 패널이나 도감에서 "왜 이렇게 생겼는지" 보여줄 때 */
export function explain(p: NameParts): Reason[] {
  const g = genesFromParts(p)
  return READOUT.map((r) => {
    const syl = p[r.src]
    const jamo = syl[JAMO_KEY[r.place]]
    return {
      slot: r.slot,
      label: r.label,
      from: syl.char,
      place: r.place,
      jamo: jamo === '' ? '받침없음' : jamo,
      value: g[r.slot],
    }
  })
}

/* ------------------------------------------------------------------ */
/* 조합 수                                                             */
/* ------------------------------------------------------------------ */

export const SLOT_SIZES = {
  body: 12, color: 6, pattern: 6, eye: 11, mouth: 9, cheek: 6, hair: 11, tail: 9, deco: 6,
} as const

export const TOTAL_COMBINATIONS = Object.values(SLOT_SIZES).reduce((a, b) => a * b, 1)

/** 유전자를 짧은 코드로 — 도감 검색·공유용 */
export const encodeGenes = (g: MoimoGenes) =>
  [g.body, g.color, g.pattern, g.eye, g.mouth, g.cheek, g.hair, g.tail, g.deco]
    .map((n) => n.toString(36).toUpperCase())
    .join('')
