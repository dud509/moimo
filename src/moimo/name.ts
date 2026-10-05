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
 * 이름 240여 개로 어림했다. pct 가 그 비율(%)이다. 매칭표 페이지
 * (/mapping.html) 가 이 표를 그대로 읽어 그림으로 보여 준다.
 */

/**
 * 표 한 줄 — 이 자모들이면 이 파츠.
 * jamo 가 null 이면 «나머지» 줄이다. 표에 없는 자모는 모두 이 줄로 간다.
 * '' 는 받침 없음.
 */
export type MapRow = {
  jamo: string[] | null; label?: string; part: number; pct: number; note?: string
  /** 모양으로 짝지은 매칭에서 — 자모의 어디가 파츠의 어디와 닮았는지 */
  why?: string
}

const toMap = (rows: MapRow[]) => {
  const map: Record<string, number> = {}
  for (const r of rows) for (const j of r.jamo ?? []) map[j] = r.part
  const rest = rows.find((r) => !r.jamo)?.part
  return (jamo: string) => map[jamo] ?? rest!
}

/** 몸통 — 성. 김·이·박은 성 전체를 먼저 보고, 아니면 초성으로 떨어진다 */
const BODY_SURNAME: MapRow[] = [
  { jamo: ['김'], part: 2, pct: 22.4 },
  { jamo: ['이'], part: 8, pct: 15.3 },
  { jamo: ['박'], part: 6, pct: 8.8 },
]
const BODY_CHO: MapRow[] = [
  { jamo: ['ㅇ'], part: 4, pct: 11.5 },
  { jamo: ['ㅈ'], part: 3, pct: 11.1 },
  { jamo: ['ㅅ'], part: 11, pct: 6.9 },
  { jamo: ['ㄱ'], part: 10, pct: 6.4 },
  { jamo: ['ㅊ'], part: 5, pct: 5.9 },
  { jamo: ['ㅎ'], part: 12, pct: 5.7 },
  { jamo: null, label: 'ㅁ ㄷ ㄹ ㅋ ㅌ ㅍ', part: 7, pct: 2.5 },
  { jamo: ['ㅂ'], part: 9, pct: 2.1 },
  { jamo: ['ㄴ'], part: 1, pct: 1.5 },
]

/** 몸통 색깔 — 성 중성 */
/**
 * 몸통 색 — 성의 중성.
 *
 * 다만 ㅣ 하나에 김(21.5%)과 이(14.7%)가 같이 들어 있어 성씨의 44% 가
 * 한 색으로 몰렸다. ㅣ 만 받침 유무로 한 번 더 가른다. 김은 받침이 있고
 * 이는 없으므로 둘이 갈라지고, 가장 큰 통이 44% 에서 28% 로 내려간다.
 * 대신 ㅗ 와 ㅜ 를 한 통에 넣어 색 수는 여섯 그대로 둔다.
 *
 * 갈색은 받침 없는 성이 많은 통에 두면 무늬 없이 온몸이 갈색인 아이가
 * 쏟아진다 (ㅗㅜ 일 때 조·오·고·노… 로 갈색의 58%). 받침 있는 성이
 * 대부분인 ㅓ(정·전·성) 에 둔다. 민트·연보라는 원래 모이모 색이 아니라
 * 덜 흔한 통으로 보낸다.
 */
function colorOf(jung: string, jong: string): number {
  if (jung === 'ㅣ') return jong ? 1 : 6   // 받침 있으면 파랑(김 계열), 없으면 연보라(이 계열)
  if (jung === 'ㅏ') return 2
  if (jung === 'ㅓ') return 4
  if (jung === 'ㅗ' || jung === 'ㅜ') return 5
  return 3
}

/** 몸통 무늬 — 성 종성. 받침 없는 성(34.5%)은 무늬가 없다. pct 는 받침 있는 성 안에서 */
const MORPH: MapRow[] = [
  { jamo: [''], part: 0, pct: 0, note: '받침 없는 성은 무늬 없음' },
  { jamo: ['ㅁ'], part: 3, pct: 39.8 },
  { jamo: ['ㅇ'], part: 2, pct: 23.4 },
  { jamo: ['ㄴ'], part: 1, pct: 20.5 },
  { jamo: ['ㄱ'], part: 5, pct: 15.9 },
  { jamo: null, label: 'ㄹ ㅂ ㅅ …', part: 4, pct: 0.3 },
]

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

/*
 * 눈 01 과 머리장식 11 은 겹쳐 놓으면 못 볼 꼴이 된다. 둘은 이름의 서로
 * 다른 글자에서 오므로 규칙으로 떼어 놓을 수 없고, 만날 확률만 낮출 수 있다.
 * 그래서 이 둘은 무난함 순서와 상관없이 가장 드문 자모에 묶어 둔다 —
 * 눈 01 은 앞 글자의 ㄹ, 머리장식 11 은 뒤 글자의 ㄷ. «라다» 처럼 되어야
 * 만나므로 사실상 만나지 않는다.
 */

/** 눈 — 이름 앞 글자 초성 */
const EYE: MapRow[] = [
  { jamo: ['ㅅ'], part: 2, pct: 22.5 },
  { jamo: ['ㅈ'], part: 10, pct: 20.8 },
  { jamo: ['ㅇ'], part: 4, pct: 19.2 },
  { jamo: ['ㅎ'], part: 9, pct: 10.0 },
  { jamo: ['ㅁ'], part: 5, pct: 7.9 },
  { jamo: ['ㄷ'], part: 6, pct: 5.8 },
  { jamo: ['ㄱ'], part: 3, pct: 5.8 },
  { jamo: null, label: 'ㅊ ㅋ ㅌ ㅍ', part: 7, pct: 4.2 },
  { jamo: ['ㅂ'], part: 8, pct: 1.7 },
  { jamo: ['ㄴ'], part: 11, pct: 1.2 },
  { jamo: ['ㄹ'], part: 1, pct: 0.8, note: '머리장식 11 과 떼어 둔다' },
]

/** 머리장식 — 이름 뒤 글자 초성 */
const HAIR: MapRow[] = [
  { jamo: ['ㅇ'], part: 4, pct: 35.4 },
  { jamo: ['ㅎ'], part: 7, pct: 19.6 },
  { jamo: ['ㅈ'], part: 6, pct: 19.6 },
  { jamo: ['ㅅ'], part: 3, pct: 8.8 },
  { jamo: ['ㅁ'], part: 5, pct: 5.8 },
  { jamo: ['ㄹ'], part: 1, pct: 5.4 },
  { jamo: ['ㅂ'], part: 2, pct: 1.7 },
  { jamo: ['ㄱ'], part: 8, pct: 1.2 },
  { jamo: null, label: 'ㅊ ㅋ ㅌ ㅍ', part: 10, pct: 1.2 },
  { jamo: ['ㄴ'], part: 9, pct: 1.2 },
  { jamo: ['ㄷ'], part: 11, pct: 0.1, note: '눈 01 과 떼어 둔다' },
]

/** 입 — 이름 앞 글자 중성 */
const MOUTH: MapRow[] = [
  { jamo: ['ㅣ'], part: 5, pct: 24.2 },
  { jamo: ['ㅓ'], part: 4, pct: 13.8 },
  { jamo: ['ㅜ'], part: 9, pct: 12.1 },
  { jamo: ['ㅏ'], part: 1, pct: 10.8 },
  { jamo: ['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'], part: 7, pct: 10.4 },
  { jamo: ['ㅕ'], part: 3, pct: 9.2 },
  { jamo: ['ㅗ'], part: 6, pct: 8.3 },
  { jamo: ['ㅡ'], part: 2, pct: 5.8 },
  { jamo: null, label: 'ㅑ ㅛ ㅠ ㅘ ㅝ ㅢ ㅟ ㅚ ㅙ ㅞ', part: 8, pct: 5.4 },
]

/** 꼬리 — 이름 뒤 글자 중성 */
const TAIL: MapRow[] = [
  { jamo: ['ㅜ'], part: 3, pct: 25.8 },
  { jamo: ['ㅣ'], part: 7, pct: 18.8 },
  { jamo: ['ㅕ'], part: 2, pct: 13.8 },
  { jamo: null, label: 'ㅑ ㅛ ㅠ ㅘ ㅝ ㅢ ㅟ ㅚ ㅙ ㅞ', part: 6, pct: 12.5 },
  { jamo: ['ㅓ'], part: 1, pct: 7.9 },
  { jamo: ['ㅏ'], part: 4, pct: 7.5 },
  { jamo: ['ㅡ'], part: 9, pct: 6.2 },
  { jamo: ['ㅗ'], part: 5, pct: 5.8 },
  { jamo: ['ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'], part: 8, pct: 1.7 },
]

/** 볼 장식 — 이름 앞 글자 종성. 받침 없음도 그림이 따로 있다 */
const CHEEK: MapRow[] = [
  { jamo: [''], part: 1, pct: 59.6 },
  { jamo: ['ㄴ'], part: 5, pct: 22.9 },
  { jamo: ['ㅇ'], part: 3, pct: 16.7 },
  { jamo: null, label: 'ㄹ ㅂ ㅅ …', part: 4, pct: 0.8 },
  { jamo: ['ㄱ'], part: 2, pct: 0.1 },
  { jamo: ['ㅁ'], part: 6, pct: 0.1 },
]

/** 몸통 장식 — 이름 뒤 글자 종성 */
const DECO: MapRow[] = [
  { jamo: ['ㄴ'], part: 6, pct: 48.3 },
  { jamo: [''], part: 3, pct: 35.8 },
  { jamo: ['ㅇ'], part: 5, pct: 8.8 },
  { jamo: null, label: 'ㄹ ㅂ ㅅ …', part: 4, pct: 2.9 },
  { jamo: ['ㄱ'], part: 1, pct: 2.9 },
  { jamo: ['ㅁ'], part: 2, pct: 1.2 },
]

/* ------------------------------------------------------------------ */
/* 모양으로 짝짓기                                                      */
/* ------------------------------------------------------------------ */

/*
 * 자모의 생김새와 파츠의 생김새를 잇는다. ㅇ 은 동그란 귀, ㄹ 은 꼬불한 귀,
 * ㅜ 는 아래로 떨어지는 혀처럼. 전시장에서 «내 이름 글자가 이렇게 생겨서
 * 이 파츠구나» 가 바로 읽히게 하려는 것이다.
 *
 * 파츠 수보다 자모가 많은 자리는 생김새가 가까운 자모끼리 묶었다 —
 * ㄱ·ㅋ, ㄷ·ㅌ 처럼 획 하나 더한 짝이 먼저 묶인다. 흔한 정도는 따지지
 * 않으므로 pct 는 참고로만 적어 둔다(자리마다 그 묶음이 나오는 비율).
 */

/*
 * 몸통은 흔한 정도 매칭처럼 김·이·박을 먼저 따로 본다. 셋은 제 초성이 가장
 * 닮은 귀를 갖고, 같은 초성의 나머지 성은 그다음으로 닮은 귀로 간다.
 */
const SHAPE_BODY: MapRow[] = [
  { jamo: ['김'], part: 5, pct: 21.4, why: '김의 ㄱ·ㅣ 세로획 둘처럼 나란히 곧게 선 귀' },
  { jamo: ['이'], part: 10, pct: 14.6, why: '이의 ㅇ 처럼 동그란 귀' },
  { jamo: ['박'], part: 7, pct: 8.4, why: '박의 ㅂ 처럼 네모 반듯한 귀' },
  { jamo: ['정'], part: 11, pct: 4.3, why: '정의 ㅈ 두 다리처럼 비스듬히 벌어진 귀' },
  { jamo: ['ㅇ'], part: 6, pct: 10.3, why: 'ㅇ 처럼 동그란 귀가 양옆에' },
  { jamo: ['ㅈ'], part: 9, pct: 7.2, why: 'ㅈ 의 두 다리처럼 얼굴 양옆으로 길게 내려오는 귀' },
  { jamo: ['ㅅ'], part: 3, pct: 6.8, why: 'ㅅ 처럼 뾰족한 고양이 귀' },
  { jamo: ['ㄱ', 'ㅋ'], part: 4, pct: 6.2, why: 'ㄱ 처럼 꺾여 내려오는 접힌 귀' },
  { jamo: ['ㅊ'], part: 1, pct: 6.2, why: 'ㅊ 처럼 획이 많아 삐죽삐죽한 털' },
  { jamo: ['ㅎ'], part: 12, pct: 5.7, why: 'ㅎ 의 동그라미처럼 동글게 말린 귀' },
  { jamo: ['ㅁ', 'ㅂ', 'ㅍ'], part: 2, pct: 3.6, why: 'ㅁ·ㅂ·ㅍ 처럼 옆으로 넓게 퍼진 뭉실한 귀' },
  { jamo: ['ㄴ', 'ㄷ', 'ㅌ', 'ㄹ'], part: 8, pct: 2.0, why: 'ㄴ·ㄷ 의 가로획처럼 옆으로 뻗은 귀' },
]

const SHAPE_MORPH: MapRow[] = [
  { jamo: null, label: '받침 없음 · ㄹ ㅂ ㅅ …', part: 0, pct: 34.1, note: '받침 없는 성과 드문 받침은 무늬 없음' },
  { jamo: ['김'], part: 4, pct: 21.4, why: '김의 ㄱ·ㅣ 처럼 세로로 반을 갈라 칠한 무늬' },
  { jamo: ['ㄱ', 'ㅇ'], part: 1, pct: 21.1, why: 'ㄱ·ㅇ 받침의 끝처럼 귀와 꼬리 끝만 물든 무늬' },
  { jamo: ['ㄴ'], part: 2, pct: 13.5, why: 'ㄴ 처럼 아래까지 꽉 채운 무늬' },
  { jamo: ['ㅁ'], part: 3, pct: 5.3, why: 'ㅁ 처럼 얼굴을 네모나게 비워 둔 무늬' },
  { jamo: ['정', '성'], part: 5, pct: 4.7, why: '정·성의 ㅇ 받침처럼 머리를 동그랗게 덮는 무늬' },
]

/*
 * 눈 01 과 머리장식 11 은 겹쳐 놓으면 못 볼 꼴이 된다. 모양으로 짝지으면
 * 눈 01(뾰족한 눈)은 흔한 ㅅ 에 가지만, 머리장식 11(안경)이 뒤 글자에
 * 거의 없는 ㅍ 에 가서 둘이 만날 일은 드물다.
 */
const SHAPE_EYE: MapRow[] = [
  { jamo: ['ㅅ'], part: 9, pct: 21.9, why: 'ㅅ 의 두 획이 만나는 자리처럼 가로획이 걸친 눈' },
  { jamo: ['ㅇ'], part: 2, pct: 18.6, why: 'ㅇ 처럼 속이 꽉 찬 눈' },
  { jamo: ['ㅈ'], part: 3, pct: 14.2, why: 'ㅈ 의 윗획처럼 눈꺼풀이 덮은 눈 — 재·준·종 처럼 남자 이름에 많다' },
  { jamo: ['지'], part: 11, pct: 9.6, why: '지 는 흔해서 ㅈ 에서 떼어 빙글빙글 도는 눈을 준다' },
  { jamo: ['하', '혜', '희'], part: 6, pct: 5.6, why: '하·혜·희 는 여자 이름에 많아 ㅎ 에서 떼어 속눈썹이 삐친 눈을 준다' },
  { jamo: ['ㅎ'], part: 5, pct: 3.9, why: 'ㅎ 의 동그라미처럼 테두리 안에 또 하나 든 눈 — 현·한 처럼 남녀 모두 쓴다' },
  { jamo: ['ㅁ'], part: 10, pct: 9.3, why: 'ㅁ 처럼 또렷한 동그란 눈' },
  { jamo: ['ㄷ'], part: 4, pct: 7.0, why: 'ㄷ 의 짧은 획처럼 콕 찍은 점 눈' },
  { jamo: ['ㄱ', 'ㅋ'], part: 7, pct: 4.2, why: 'ㄱ 의 가로획처럼 감은 눈' },
  { jamo: ['ㄴ', 'ㄹ', 'ㅌ'], part: 1, pct: 2.9, why: 'ㄴ·ㄹ·ㅌ 의 꺾인 모서리처럼 끝이 뾰족한 눈' },
  { jamo: ['ㅊ', 'ㅂ', 'ㅍ'], part: 8, pct: 2.8, why: 'ㅊ 처럼 빛이 뻗는 반짝 눈' },
]

const SHAPE_HAIR: MapRow[] = [
  { jamo: ['ㅇ'], part: 10, pct: 20.4, why: 'ㅇ 처럼 동글동글한 잎이 모인 네잎클로버' },
  { jamo: ['ㅈ'], part: 9, pct: 15.9, why: 'ㅈ 처럼 꼭지가 뾰족한 고깔' },
  { jamo: ['ㅎ'], part: 6, pct: 13.9, why: 'ㅎ 의 꼭지처럼 위로 돋은 새싹 — 호·훈·혁 처럼 남자 이름에 많다' },
  { jamo: ['ㅅ'], part: 1, pct: 11.7, why: 'ㅅ 처럼 뾰족한 별' },
  { jamo: ['영', '연', '여', '열', '엽'], part: 3, pct: 11.2, why: '영·연 은 흔해서 ㅇ 에서 떼어 날개 달린 하트를 준다' },
  { jamo: ['현'], part: 5, pct: 8.9, why: '현 은 흔해서 ㅎ 에서 떼어 초록 잎 꼭지를 준다' },
  { jamo: ['ㅁ'], part: 11, pct: 5.3, why: 'ㅁ 처럼 네모난 테 둘을 이은 안경' },
  { jamo: ['ㄱ', 'ㅋ'], part: 2, pct: 4.1, why: 'ㄱ 처럼 꺾인 꼭지가 달린 체리' },
  { jamo: ['ㄹ'], part: 4, pct: 4.0, why: 'ㄹ 처럼 고불고불 묶은 작은 리본 한 쌍 — 린·리 처럼 여자 이름에 많다' },
  { jamo: ['ㄴ', 'ㄷ', 'ㅌ', 'ㅂ', 'ㅍ'], part: 7, pct: 2.4, why: '드문 초성은 작은 날개 한 쌍' },
  { jamo: ['ㅊ'], part: 8, pct: 2.3, why: 'ㅊ 의 꼭지처럼 위에 얹은 달걀 프라이 — 철·찬 처럼 남자 이름에 많다' },
]

const SHAPE_MOUTH: MapRow[] = [
  { jamo: ['ㅣ'], part: 3, pct: 24.2, why: 'ㅣ 처럼 가운데로 혀가 내려온 입' },
  { jamo: ['ㅓ'], part: 7, pct: 13.8, why: 'ㅓ 의 곁획처럼 옆으로 혀를 내민 입' },
  { jamo: ['ㅜ'], part: 6, pct: 12.1, why: 'ㅜ 처럼 가로획 아래로 뾰족한 입' },
  { jamo: ['ㅏ'], part: 1, pct: 10.8, why: 'ㅏ 의 곁획처럼 한쪽 끝이 올라간 입' },
  { jamo: null, label: 'ㅐ ㅔ ㅒ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ', part: 2, pct: 10.8, why: '모음 둘이 겹쳐 소리가 섞이니, 꾹 다문 가장 조용한 입' },
  { jamo: ['ㅑ', 'ㅕ'], part: 9, pct: 9.2, why: 'ㅕ 의 곁획 둘처럼 두 번 굽은 입' },
  { jamo: ['ㅗ'], part: 4, pct: 8.3, why: 'ㅗ 처럼 가운데가 솟은 입' },
  { jamo: ['ㅡ'], part: 5, pct: 5.8, why: 'ㅡ 처럼 길게 그은 입' },
  { jamo: ['ㅛ', 'ㅠ'], part: 8, pct: 5.0, why: 'ㅠ 의 두 다리처럼 두 줄로 드러난 이' },
]

const SHAPE_TAIL: MapRow[] = [
  { jamo: ['ㅜ'], part: 1, pct: 21.7, why: 'ㅜ 처럼 아래로 말려 내려가는 꼬리' },
  { jamo: ['ㅑ', 'ㅕ', 'ㅛ'], part: 9, pct: 24.3, why: '곁획이 둘인 모음처럼 두 번 굽이치는 꼬리' },
  { jamo: ['ㅣ'], part: 6, pct: 18.2, why: 'ㅣ 처럼 곧게 내리긋은 굵은 꼬리' },
  { jamo: ['ㅓ'], part: 2, pct: 8.5, why: 'ㅓ 의 곁획처럼 뒤로 꺾인 꼬리' },
  { jamo: ['ㅡ'], part: 3, pct: 5.8, why: 'ㅡ 처럼 길게 누운 꼬리' },
  { jamo: ['ㅗ'], part: 7, pct: 5.3, why: 'ㅗ 처럼 위로 솟아 말린 꼬리' },
  { jamo: null, label: 'ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ', part: 8, pct: 7.3, why: '모음 둘을 묶은 것처럼 리본으로 묶은 꼬리' },
  { jamo: ['ㅏ'], part: 4, pct: 3.5, why: 'ㅏ 의 곁획처럼 끝에 방울이 달린 꼬리' },
  { jamo: ['ㅠ', 'ㅐ', 'ㅔ', 'ㅒ', 'ㅖ'], part: 5, pct: 5.2, why: 'ㅠ·ㅐ 의 세로획 둘처럼 몽글몽글한 구름 꼬리' },
]

const SHAPE_CHEEK: MapRow[] = [
  { jamo: [''], part: 1, pct: 45.3, why: '받침이 없으니 꾸밈 없는 동그란 분홍 볼' },
  { jamo: ['ㄴ', 'ㄷ'], part: 2, pct: 22.1, why: 'ㄴ·ㄷ 의 곧은 획처럼 줄 그은 볼' },
  { jamo: ['ㅇ'], part: 5, pct: 21.7, why: 'ㅇ 처럼 빙글 도는 나선 볼' },
  { jamo: ['지'], part: 6, pct: 9.6, why: '지 는 흔해서 받침 없음에서 떼어 반짝이는 노란 볼을 준다' },
  { jamo: ['ㄱ', 'ㅁ', 'ㅂ'], part: 3, pct: 0.7, why: 'ㅁ 처럼 꽉 차게 번진 볼' },
  { jamo: null, label: 'ㄹ ㅅ ㅈ ㅊ …', part: 4, pct: 0.6, why: '드문 받침은 빗금이 여럿 그어진 볼' },
]

const SHAPE_DECO: MapRow[] = [
  { jamo: ['ㄴ'], part: 3, pct: 29.6, why: 'ㄴ 의 아래 획처럼 비스듬히 늘어진 끈의 가방' },
  { jamo: [''], part: 6, pct: 29.3, why: '받침이 없으니 몸 뒤로 가볍게 돋은 날개' },
  { jamo: ['ㅇ'], part: 2, pct: 12.2, why: 'ㅇ 처럼 동그란 방울' },
  { jamo: ['연', '은', '린'], part: 1, pct: 11.2, why: '연·은·린 은 흔해서 ㄴ 에서 떼어 리본을 준다 — 여자 이름에 많다' },
  { jamo: ['현'], part: 5, pct: 8.9, why: '현 은 흔해서 ㄴ 에서 떼어 반다나를 준다' },
  { jamo: null, label: 'ㄱ ㄹ ㅁ …', part: 4, pct: 8.8, why: 'ㄱ 처럼 모나게 묶은 스카프 매듭' },
]

/* ------------------------------------------------------------------ */
/* 매칭 두 벌                                                           */
/* ------------------------------------------------------------------ */

export type SlotMapping = {
  slot: 'body' | 'morph' | 'eye' | 'mouth' | 'cheek' | 'hair' | 'tail' | 'deco'
  label: string
  from: string
  rows: MapRow[]
}

export type MappingId = 'freq' | 'shape'

export type MappingSet = { id: MappingId; name: string; desc: string; slots: SlotMapping[] }

const slots = (r: Record<SlotMapping['slot'], MapRow[]>): SlotMapping[] => [
  { slot: 'body', label: '몸통', from: '성 초성', rows: r.body },
  { slot: 'morph', label: '몸통 무늬', from: '성 종성', rows: r.morph },
  { slot: 'eye', label: '눈', from: '이름 앞 글자 초성', rows: r.eye },
  { slot: 'mouth', label: '입', from: '이름 앞 글자 중성', rows: r.mouth },
  { slot: 'cheek', label: '볼 장식', from: '이름 앞 글자 종성', rows: r.cheek },
  { slot: 'hair', label: '머리 장식', from: '이름 뒤 글자 초성', rows: r.hair },
  { slot: 'tail', label: '꼬리', from: '이름 뒤 글자 중성', rows: r.tail },
  { slot: 'deco', label: '몸통 장식', from: '이름 뒤 글자 종성', rows: r.deco },
]

export const MAPPINGS: Record<MappingId, MappingSet> = {
  freq: {
    id: 'freq',
    name: '흔한 정도',
    desc: '흔한 자모일수록 무난한 파츠, 드문 자모일수록 튀는 파츠',
    slots: slots({
      body: [...BODY_SURNAME, ...BODY_CHO], morph: MORPH, eye: EYE, mouth: MOUTH,
      cheek: CHEEK, hair: HAIR, tail: TAIL, deco: DECO,
    }),
  },
  shape: {
    id: 'shape',
    name: '닮은 모양',
    desc: '자모의 생김새와 파츠의 생김새를 잇는다',
    slots: slots({
      body: SHAPE_BODY, morph: SHAPE_MORPH, eye: SHAPE_EYE, mouth: SHAPE_MOUTH,
      cheek: SHAPE_CHEEK, hair: SHAPE_HAIR, tail: SHAPE_TAIL, deco: SHAPE_DECO,
    }),
  },
}

/** 지금 월드에서 쓰는 매칭. 'freq' 로 바꾸면 흔한 정도로 되돌아간다 */
export const ACTIVE_MAPPING: MappingId = 'shape'

/** 한 글자 통째(김·정·영…)인지, 자모 하나인지 */
const isSyllable = (j: string) => j.length === 1 && j >= '가'

/**
 * 한 자리의 표를 읽는 법. 글자 통째로 적힌 줄(김·이·박, 영·연 같은)을 먼저
 * 보고, 없으면 자모로 찾는다. 자모 하나가 너무 흔해 파츠 하나가 몰릴 때,
 * 그 자모 가운데 흔한 글자만 떼어 다른 파츠에 줄 수 있게 하려는 것이다.
 */
function reader(rows: MapRow[]) {
  const sylRows = rows.filter((r) => r.jamo?.some(isSyllable))
  const bySyllable = toMap([...sylRows, { jamo: null, part: -1, pct: 0 }])
  const byJamo = toMap(rows.filter((r) => !sylRows.includes(r)))
  return (syllable: string, jamo: string) => {
    const v = bySyllable(syllable)
    return v >= 0 ? v : byJamo(jamo)
  }
}

type Lookup = Record<SlotMapping['slot'], (syllable: string, jamo: string) => number>

const LOOKUPS = Object.fromEntries(
  Object.values(MAPPINGS).map((m) => [
    m.id,
    Object.fromEntries(m.slots.map((s) => [s.slot, reader(s.rows)])) as Lookup,
  ]),
) as Record<MappingId, Lookup>

/* ------------------------------------------------------------------ */
/* 조립                                                                */
/* ------------------------------------------------------------------ */

export function genesFromParts(p: NameParts, mapping: MappingId = ACTIVE_MAPPING): MoimoGenes {
  const m = LOOKUPS[mapping]
  return {
    body: m.body(p.surname, p.s.cho),
    color: colorOf(p.s.jung, p.s.jong),
    morph: m.morph(p.surname, p.s.jong),
    tone: toneOf(p.n1.jung),
    eye: m.eye(p.n1.char, p.n1.cho),
    mouth: m.mouth(p.n1.char, p.n1.jung),
    cheek: m.cheek(p.n1.char, p.n1.jong),
    hair: m.hair(p.n2.char, p.n2.cho),
    tail: m.tail(p.n2.char, p.n2.jung),
    deco: m.deco(p.n2.char, p.n2.jong),
  }
}

/** 이름 한 줄이면 모이모 하나. 한글 이름이 아니면 null */
export function genesFromName(raw: string, mapping: MappingId = ACTIVE_MAPPING): MoimoGenes | null {
  const parts = splitName(raw)
  return parts ? genesFromParts(parts, mapping) : null
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
/**
 * 마을에 미리 사는 모이모의 성. 실제 성씨 인구(2015 인구총조사, 천 명
 * 어림값) 대로 뽑아, 사람들이 이름을 넣었을 때와 같은 비율로 섞이게 한다.
 */
const SURNAMES: readonly [string, number][] = [
  ['김', 10690], ['이', 7307], ['박', 4192], ['최', 2334], ['정', 2152], ['강', 1177], ['조', 1057],
  ['윤', 1021], ['장', 993], ['임', 823], ['한', 773], ['오', 764], ['서', 752], ['신', 741],
  ['권', 706], ['황', 697], ['안', 686], ['송', 684], ['전', 559], ['홍', 559], ['유', 547],
  ['고', 471], ['문', 465], ['양', 462], ['손', 457], ['배', 400], ['백', 381], ['허', 327],
  ['남', 276], ['심', 273], ['노', 267], ['하', 231], ['구', 209], ['곽', 203], ['주', 202],
  ['성', 199], ['우', 190], ['차', 181], ['민', 172], ['진', 166], ['지', 160], ['나', 158],
  ['엄', 146], ['변', 134], ['원', 133], ['방', 132], ['채', 131], ['천', 120], ['공', 92], ['현', 89],
]
const SURNAME_TOTAL = SURNAMES.reduce((sum, [, n]) => sum + n, 0)

/**
 * 실제로 많이 쓰는 이름. 앞뒤 글자를 따로 뽑아 붙이면 «시겸» «도람» 처럼
 * 아무도 안 쓰는 이름이 나와서, 통째로 고른다. 전시를 보러 올 20~30대가
 * 대부분이고 그 부모·선생님 또래도 조금 섞었다.
 */
const GIVEN = `
서연 민서 지민 서현 수빈 유진 민지 지원 지현 예린 수민 지은 하은 윤서 채원
예은 소연 지수 다은 은지 혜원 예진 수연 지영 현지 서영 민정 유나 가은 다현
나연 채은 서윤 지아 하윤 수아 예원 은서 승연 혜린 소희 다인 지혜 은비 보람
슬기 아름 미진 은영 수진 혜진 정은 민영 지연 세영 나영 하늘 다솜 예지 소영
유리 윤아 주연 은주 미소 시은 채린 지유 서진 가영 다영 연주 수현 하린 주희
민준 지훈 현우 준호 승민 동현 성민 준영 민수 지호 우진 도윤 시우 건우 준서
현준 민재 승현 재원 태윤 진우 은호 지환 성현 상우 정우 민혁 준혁 재민 영훈
형준 대현 동욱 승우 태현 민성 재현 종현 한결 유찬 시원 재훈 용준 진혁 주원
예준 서준 하준 도현 윤호 경민 상현 성훈 정민 태훈 기현 준수 석진 지성 현수
영민 동건 주호 연우 승훈 우현 재윤 민규 성준 지웅
미경 은정 정희 현숙 미영 경희 혜경 수정 지선 은경 미숙 선영 영미
영수 성호 정훈 동수 상철 영철 명수 재석 성진 경수 병철 종호
`.split(/\s+/).filter(Boolean)

/** 이름 하나를 지어준다 */
export function randomKoreanName(rnd: () => number = Math.random): string {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]
  let r = rnd() * SURNAME_TOTAL
  const surname = SURNAMES.find(([, n]) => (r -= n) < 0)?.[0] ?? '김'
  return surname + pick(GIVEN)
}
