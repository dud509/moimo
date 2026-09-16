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
  morph: number    // 0..5  (0 = 무늬 없음)
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
  /** 이름 앞 글자 */
  n1: Syllable
  /** 이름 뒤 글자 — 외자 이름이면 n1을 한 번 더 읽는다 */
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

  // 복성이어도 자모는 첫 글자에서만 읽는다 (남궁민수 → 남)
  const s = decompose(surname[0])!
  // 이름은 뒤에서 두 글자 (김민수현 → 수현)
  const echoed = given.length < 2
  const n1 = decompose(given[echoed ? 0 : given.length - 2])!
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
/**
 * 몸통 색 — 성의 중성.
 *
 * 다만 ㅣ 하나에 김(21.5%)과 이(14.7%)가 같이 들어 있어 성씨의 44% 가
 * 한 색으로 몰렸다. ㅣ 만 받침 유무로 한 번 더 가른다. 김은 받침이 있고
 * 이는 없으므로 둘이 갈라지고, 가장 큰 통이 44% 에서 28% 로 내려간다.
 * 대신 ㅗ 와 ㅜ 를 한 통에 넣어 색 수는 여섯 그대로 둔다.
 */
function colorOf(jung: string, jong: string): number {
  if (jung === 'ㅣ') return jong ? 1 : 5   // 받침 있으면 파랑(김 계열), 없으면 흰색(이 계열)
  if (jung === 'ㅏ') return 2
  if (jung === 'ㅓ') return 3
  if (jung === 'ㅗ' || jung === 'ㅜ') return 4
  return 6
}

/** 몸통 무늬 — 성 종성. 받침 없으면 무늬 없음 */
const MORPH_BY_JONG: Record<string, number> = { '': 0, ㄱ: 1, ㄴ: 2, ㅁ: 3, ㅇ: 4 }

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
    color: colorOf(p.s.jung, p.s.jong),
    morph: pick(MORPH_BY_JONG, p.s.jong, 5),
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
  { slot: 'morph',   label: '몸통 무늬', src: 's',  place: '종성' },
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
    let jamo: string = syl[JAMO_KEY[r.place]]
    // 색은 ㅣ 일 때만 받침까지 보고 정해지므로 그대로 읽어 준다
    if (r.slot === 'color' && jamo === 'ㅣ') jamo = p.s.jong ? 'ㅣ · 받침 있음' : 'ㅣ · 받침 없음'
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
  body: 12, color: 6, morph: 6, eye: 11, mouth: 9, cheek: 6, hair: 11, tail: 9, deco: 6,
} as const

export const TOTAL_COMBINATIONS = Object.values(SLOT_SIZES).reduce((a, b) => a * b, 1)

/** 유전자를 짧은 코드로 — 도감 검색·공유용 */
export const encodeGenes = (g: MoimoGenes) =>
  [g.body, g.color, g.morph, g.eye, g.mouth, g.cheek, g.hair, g.tail, g.deco]
    .map((n) => n.toString(36).toUpperCase())
    .join('')

/* ------------------------------------------------------------------ */
/* 이웃 이름 — 마을을 비어 보이지 않게 채울 때만 쓴다                    */
/* ------------------------------------------------------------------ */

// 몸통 색은 성이 정하므로, 여섯 색이 고루 나오도록 성씨를 고른다.
// 한 색에 쏠린 목록을 쓰면 마을 전체가 그 색으로 물든다.
const SURNAMES = [
  '김', '임', '신', '심', '민', '진',   // 파랑   ㅣ + 받침
  '이', '지', '기',                     // 흰색   ㅣ
  '박', '강', '장', '한', '남', '안',   // 노랑   ㅏ
  '정', '서', '전', '허', '성',         // 분홍   ㅓ
  '조', '오', '송', '문',               // 진갈색 ㅗ ㅜ
  '최', '윤', '권', '황', '배', '유',   // 연보라 나머지
]
const GIVEN_1 = ['민', '서', '지', '하', '예', '수', '준', '유', '도', '시', '주', '건', '은', '채', '연', '재', '다', '가', '나', '소']
const GIVEN_2 = ['준', '연', '우', '윤', '아', '진', '현', '원', '빈', '경', '호', '람', '온', '영', '희', '린', '겸', '율', '후', '솔']

/** 이름 하나를 지어준다 */
export function randomKoreanName(rnd: () => number = Math.random): string {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]
  return pick(SURNAMES) + pick(GIVEN_1) + pick(GIVEN_2)
}
