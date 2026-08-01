// ============================================================
// ★★★ 캐릭터 그림을 바꾸고 싶을 때 고치는 파일 ★★★
//
// 여기 적힌 파일 이름들이 곧 캐릭터의 재료(파츠)입니다.
// 실제 그림 파일은 frontend/public/parts/ 폴더 안에 들어 있습니다.
//
// [직접 그린 그림으로 바꾸는 방법]
//   1. 그림을 1000 x 1000 정사각형, 배경 투명으로 그립니다. (PNG 또는 SVG)
//   2. frontend/public/parts/body, eyes, mouth, hair 폴더에 넣습니다.
//   3. 아래 목록에 파일 이름을 적어 줍니다. 확장자까지 그대로 적으면 됩니다.
//
//   자세한 안내는 frontend/public/parts/README.md 를 보세요.
// ============================================================

/** 그림을 겹쳐 쌓는 순서입니다. 위에서부터 아래로 덮어씌워집니다. */
export const LAYER_ORDER = ['body', 'hair', 'eyes', 'mouth'];

/** 각 부위별로 고를 수 있는 그림 목록입니다. 마음껏 추가하거나 지워도 됩니다. */
export const PARTS = {
  // 몸통
  body: ['body-01.svg', 'body-02.svg', 'body-03.svg', 'body-04.svg', 'body-05.svg'],
  // 머리 장식 (hair-06 은 '장식 없음' 입니다)
  hair: ['hair-01.svg', 'hair-02.svg', 'hair-03.svg', 'hair-04.svg', 'hair-05.svg', 'hair-06.svg'],
  // 눈
  eyes: ['eyes-01.svg', 'eyes-02.svg', 'eyes-03.svg', 'eyes-04.svg', 'eyes-05.svg', 'eyes-06.svg'],
  // 입
  mouth: ['mouth-01.svg', 'mouth-02.svg', 'mouth-03.svg', 'mouth-04.svg', 'mouth-05.svg'],
};

/** 캐릭터 카드의 배경색 후보입니다. */
export const BACKGROUNDS = [
  '#FDE2E4',
  '#E2ECE9',
  '#FFF1D0',
  '#E4E1F5',
  '#DDF3E4',
  '#FFE5EC',
  '#E3F2FD',
  '#FFF0E5',
];

/** 캐릭터 이름 뒤에 붙는 별명입니다. 재미 요소이니 자유롭게 바꾸세요. */
export const TITLES = [
  '조용한',
  '반짝이는',
  '느긋한',
  '용감한',
  '엉뚱한',
  '다정한',
  '호기심 많은',
  '꿈꾸는',
  '수줍은',
  '씩씩한',
  '몽글몽글한',
  '단단한',
];

/** 그림 파일의 실제 웹 주소를 만들어 줍니다. */
export function partUrl(layer, fileName) {
  return `/parts/${layer}/${fileName}`;
}
