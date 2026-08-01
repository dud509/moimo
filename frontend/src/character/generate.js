// ============================================================
// 이름 → 캐릭터를 만들어내는 부분
//
// 이름을 씨앗으로 삼아 몸통/머리/눈/입/배경색을 하나씩 골라냅니다.
// 같은 이름을 넣으면 언제나 똑같은 모이모가 태어납니다.
// ============================================================

import { makeRandom } from '../lib/random.js';
import { PARTS, LAYER_ORDER, BACKGROUNDS, TITLES, partUrl } from './parts.js';

/**
 * 이름을 받아 캐릭터 정보를 만듭니다.
 * 결과 예시:
 *   { name: '김민수', title: '반짝이는', background: '#FDE2E4',
 *     parts: { body: 'body-03.svg', hair: 'hair-01.svg', ... } }
 */
export function createCharacter(name) {
  const cleanName = String(name ?? '').trim();
  const random = makeRandom(cleanName || '모이모');

  // 배열에서 하나를 고르는 도우미
  const pick = (list) => list[Math.floor(random() * list.length)];

  const parts = {};
  for (const layer of LAYER_ORDER) {
    parts[layer] = pick(PARTS[layer]);
  }

  return {
    name: cleanName,
    title: pick(TITLES),
    background: pick(BACKGROUNDS),
    parts,
  };
}

/** 캐릭터를 그리는 데 필요한 그림 파일 주소들을 순서대로 돌려줍니다. */
export function characterImageUrls(character) {
  return LAYER_ORDER.map((layer) => partUrl(layer, character.parts[layer]));
}
