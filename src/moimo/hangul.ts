/** 한글 낱글자를 초성·중성·종성으로 쪼갠다 */

const BASE = 0xac00
const LAST = 0xd7a3

export const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const
export const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'] as const
export const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const

/** 쌍자음·겹받침을 대표 자음으로 — ㄲ→ㄱ, ㄳ→ㄱ, ㄺ→ㄹ … */
const PLAIN: Record<string, string> = {
  ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ',
  ㄳ: 'ㄱ', ㄵ: 'ㄴ', ㄶ: 'ㄴ',
  ㄺ: 'ㄹ', ㄻ: 'ㄹ', ㄼ: 'ㄹ', ㄽ: 'ㄹ', ㄾ: 'ㄹ', ㄿ: 'ㄹ', ㅀ: 'ㄹ',
  ㅄ: 'ㅂ',
}

export const plain = (jamo: string) => PLAIN[jamo] ?? jamo

export type Syllable = {
  char: string
  /** 대표음으로 정리된 초성 */
  cho: string
  jung: string
  /** 받침 없으면 빈 문자열 */
  jong: string
}

export const isHangulSyllable = (ch: string) => {
  const c = ch.codePointAt(0) ?? 0
  return c >= BASE && c <= LAST
}

export function decompose(ch: string): Syllable | null {
  if (!isHangulSyllable(ch)) return null
  const c = (ch.codePointAt(0) as number) - BASE
  return {
    char: ch,
    cho: plain(CHO[Math.floor(c / 588)]),
    jung: JUNG[Math.floor((c % 588) / 28)],
    jong: plain(JONG[c % 28]),
  }
}

/** 한글 음절만 남긴다. 공백·기호·숫자·영문은 버린다 */
export function cleanName(raw: string): string {
  return [...raw.normalize('NFC')].filter(isHangulSyllable).join('')
}
