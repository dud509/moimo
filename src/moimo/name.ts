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
  tone: number     // 0 = 흰 바탕, 1 = 한 톤 누른 바탕
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

/*
 * 파츠를 어느 자모에 줄지는 «흔한 정도» 가 정한다.
 *
 * 자리마다 자모 묶음을 이름에 자주 나오는 순으로 줄 세우고, 파츠는 무난한
 * 것부터 튀는 것 순으로 줄 세워 짝지었다. 흔한 자모일수록 무난한 파츠가,
 * 드문 자모일수록 튀는 파츠가 간다. 튀는 파츠를 받은 모이모는 그만큼 드물다.
 *
 * 빈도는 자리마다 따로 쟀다. 같은 초성이라도 이름 앞 글자와 뒤 글자에서
 * 흔한 정도가 다르다 — ㅇ 은 앞(19%)보다 뒤(35%)에 훨씬 많고, 받침 없음은
 * 앞 글자의 60% 지만 뒤 글자에서는 ㄴ(48%) 에 밀린다. 그래서 눈과 머리장식,
 * 입과 꼬리, 볼과 몸통장식은 같은 묶음을 쓰되 표는 따로 둔다.
 *
 * 성은 통계청 2015 인구주택총조사 성씨 비율, 이름은 1970~2020년대 인기
 * 이름 240여 개로 어림했다. 표 옆 숫자가 그 비율(%)이다.
 */

/** 몸통 — 성 초성. 김·이·박은 성 전체를 먼저 본다 */
const BODY_SPECIAL: Record<string, number> = {
  김: 2,   // 22.4
  이: 8,   // 15.3
  박: 6,   //  8.8
}
const BODY_BY_CHO: Record<string, number> = {
  ㅇ: 4,   // 11.5
  ㅈ: 3,   // 11.1
  ㅅ: 11,  //  6.9
  ㄱ: 10,  //  6.4
  ㅊ: 5,   //  5.9
  ㅎ: 12,  //  5.7
           //  2.5  나머지 (ㅁㄷㄹㅋㅌㅍ) → 7
  ㅂ: 9,   //  2.1
  ㄴ: 1,   //  1.5
}
const BODY_REST = 7

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
  if (jung === 'ㅣ') return jong ? 1 : 5   // 받침 있으면 파랑(김 계열), 없으면 민트(이 계열)
  if (jung === 'ㅏ') return 2
  if (jung === 'ㅓ') return 3
  if (jung === 'ㅗ' || jung === 'ㅜ') return 4
  return 6
}

/** 몸통 무늬 — 성 종성. 받침 없으면(34.5) 무늬 없음. 비율은 받침 있는 성 안에서 */
const MORPH_BY_JONG: Record<string, number> = {
  '': 0,
  ㅁ: 3,   // 39.8
  ㅇ: 2,   // 23.4
  ㄴ: 1,   // 20.5
  ㄱ: 5,   // 15.9
}
const MORPH_REST = 4  // 0.3  ㄹ ㅂ ㅅ …

/**
 * 무늬 바탕 — 이름 첫 글자의 중성.
 *
 * 무늬가 다섯인데 늘 «흰 바탕 + 이름 색» 두 가지뿐이면 다섯이 다 비슷해
 * 보인다. 바탕을 한 톤 누른 색으로도 쓸 수 있게 해 열 가지로 늘린다.
 *
 * 어느 쪽인지는 모음조화가 정한다 — ㅏㅑㅗㅛㅐ 같은 밝은 모음(양성)이면
 * 바탕도 밝게 두고, ㅓㅕㅜㅠㅡㅣ 같은 어두운 모음(음성)이면 한 톤 누른다.
 * 소리의 밝기가 그대로 색의 밝기가 되는 셈이다.
 */
const BRIGHT_VOWELS = new Set(['ㅏ', 'ㅑ', 'ㅗ', 'ㅛ', 'ㅐ', 'ㅒ', 'ㅘ', 'ㅚ', 'ㅙ'])
const toneOf = (jung: string): number => (BRIGHT_VOWELS.has(jung) ? 0 : 1)

/**
 * 눈 — 이름 앞 글자 초성.
 *
 * 눈 01 과 머리장식 11 은 겹쳐 놓으면 못 볼 꼴이 된다. 둘은 이름의 서로
 * 다른 글자에서 오므로 규칙으로 떼어 놓을 수 없고, 만날 확률만 낮출 수 있다.
 * 그래서 이 둘은 무난함 순서와 상관없이 가장 드문 자모에 묶어 둔다 —
 * 눈 01 은 앞 글자의 ㄹ, 머리장식 11 은 뒤 글자의 ㄷ. «라다» 처럼 되어야
 * 만나므로 사실상 만나지 않는다.
 */
const EYE: Record<string, number> = {
  ㅅ: 2,   // 22.5
  ㅈ: 10,  // 20.8
  ㅇ: 4,   // 19.2
  ㅎ: 9,   // 10.0
  ㅁ: 5,   //  7.9
  ㄷ: 6,   //  5.8
  ㄱ: 3,   //  5.8
           //  4.2  ㅊㅋㅌㅍ → 7
  ㅂ: 8,   //  1.7
  ㄴ: 11,  //  1.2
  ㄹ: 1,   //  0.8  머리장식 11 과 떼어 둔다
}
const EYE_REST = 7

/** 머리장식 — 이름 뒤 글자 초성 */
const HAIR: Record<string, number> = {
  ㅇ: 4,   // 35.4
  ㅎ: 7,   // 19.6
  ㅈ: 6,   // 19.6
  ㅅ: 3,   //  8.8
  ㅁ: 5,   //  5.8
  ㄹ: 1,   //  5.4
  ㅂ: 2,   //  1.7
  ㄱ: 8,   //  1.2
           //  1.2  ㅊㅋㅌㅍ → 10
  ㄴ: 9,   //  1.2
  ㄷ: 11,  //  0.1  눈 01 과 떼어 둔다
}
const HAIR_REST = 10

/** 입 — 이름 앞 글자 중성 */
const MOUTH: Record<string, number> = {
  ㅣ: 5,   // 24.2
  ㅓ: 4,   // 13.8
  ㅜ: 9,   // 12.1
  ㅏ: 1,   // 10.8
  ㅐ: 7, ㅔ: 7, ㅒ: 7, ㅖ: 7,   // 10.4
  ㅕ: 3,   //  9.2
  ㅗ: 6,   //  8.3
  ㅡ: 2,   //  5.8
}
const MOUTH_REST = 8  // 5.4  ㅑㅛㅠㅘㅝㅢㅟㅚㅙㅞ

/** 꼬리 — 이름 뒤 글자 중성 */
const TAIL: Record<string, number> = {
  ㅜ: 3,   // 25.8
  ㅣ: 7,   // 18.8
  ㅕ: 2,   // 13.8
           // 12.5  ㅑㅛㅠㅘㅝㅢㅟㅚㅙㅞ → 6
  ㅓ: 1,   //  7.9
  ㅏ: 4,   //  7.5
  ㅡ: 9,   //  6.2
  ㅗ: 5,   //  5.8
  ㅐ: 8, ㅔ: 8, ㅒ: 8, ㅖ: 8,   // 1.7
}
const TAIL_REST = 6

/** 볼 장식 — 이름 앞 글자 종성. 받침 없음도 그림이 따로 있다 */
const CHEEK: Record<string, number> = {
  '': 1,   // 59.6
  ㄴ: 5,   // 22.9
  ㅇ: 3,   // 16.7
           //  0.8  ㄹ ㅂ ㅅ … → 4
  ㄱ: 2,   //  드묾
  ㅁ: 6,   //  드묾
}
const CHEEK_REST = 4

/** 몸통 장식 — 이름 뒤 글자 종성 */
const DECO: Record<string, number> = {
  ㄴ: 6,   // 48.3
  '': 3,   // 35.8
  ㅇ: 5,   //  8.8
           //  2.9  ㄹ ㅂ ㅅ … → 4
  ㄱ: 1,   //  2.9
  ㅁ: 2,   //  1.2
}
const DECO_REST = 4

/* ------------------------------------------------------------------ */
/* 조립                                                                */
/* ------------------------------------------------------------------ */

export function genesFromParts(p: NameParts): MoimoGenes {
  return {
    body: BODY_SPECIAL[p.surname] ?? pick(BODY_BY_CHO, p.s.cho, BODY_REST),
    color: colorOf(p.s.jung, p.s.jong),
    morph: pick(MORPH_BY_JONG, p.s.jong, MORPH_REST),
    tone: toneOf(p.n1.jung),
    eye: pick(EYE, p.n1.cho, EYE_REST),
    mouth: pick(MOUTH, p.n1.jung, MOUTH_REST),
    cheek: pick(CHEEK, p.n1.jong, CHEEK_REST),
    hair: pick(HAIR, p.n2.cho, HAIR_REST),
    tail: pick(TAIL, p.n2.jung, TAIL_REST),
    deco: pick(DECO, p.n2.jong, DECO_REST),
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
  { slot: 'tone',    label: '무늬 바탕', src: 'n1', place: '중성' },
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
    // 바탕은 그 모음이 밝은 소리냐 어두운 소리냐로 갈린다
    if (r.slot === 'tone') jamo = `${jamo} · ${g.tone ? '어두운 모음' : '밝은 모음'}`
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
  body: 12, color: 6, morph: 6, tone: 2, eye: 11, mouth: 9, cheek: 6, hair: 11, tail: 9, deco: 6,
} as const

export const TOTAL_COMBINATIONS = Object.values(SLOT_SIZES).reduce((a, b) => a * b, 1)

/** 유전자를 짧은 코드로 — 도감 검색·공유용 */
export const encodeGenes = (g: MoimoGenes) =>
  [g.body, g.color, g.morph, g.tone, g.eye, g.mouth, g.cheek, g.hair, g.tail, g.deco]
    .map((n) => n.toString(36).toUpperCase())
    .join('')

/* ------------------------------------------------------------------ */
/* 이웃 이름 — 마을을 비어 보이지 않게 채울 때만 쓴다                    */
/* ------------------------------------------------------------------ */

// 몸통 색은 성이 정하므로, 여섯 색이 고루 나오도록 성씨를 고른다.
// 한 색에 쏠린 목록을 쓰면 마을 전체가 그 색으로 물든다.
const SURNAMES = [
  '김', '임', '신', '심', '민', '진',   // 파랑   ㅣ + 받침
  '이', '지', '기',                     // 민트   ㅣ
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
