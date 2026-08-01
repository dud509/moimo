// ============================================================
// "이름"을 숫자로 바꿔서, 같은 이름이면 항상 같은 캐릭터가 나오게 만드는 도구
//
// 컴퓨터의 보통 랜덤은 부를 때마다 다른 값이 나옵니다.
// 하지만 모이모는 "김민수"라는 이름을 넣으면 언제나 똑같은 모이모가
// 나와야 하므로, 이름을 씨앗(seed)으로 삼는 방식을 씁니다.
// ============================================================

/** 글자를 숫자 하나로 압축합니다. 같은 글자면 항상 같은 숫자가 나옵니다. */
export function hashString(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * 씨앗(글자)을 넣으면, 0 이상 1 미만의 숫자를 순서대로 뱉어주는 함수를 돌려줍니다.
 * 씨앗이 같으면 뱉어주는 숫자의 순서도 항상 똑같습니다.
 */
export function makeRandom(seedText) {
  let state = hashString(String(seedText));
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
