// ============================================================
// 화면에 캐릭터를 보여주는 조각
// 그림 파일들을 같은 자리에 차곡차곡 겹쳐서 한 마리로 보이게 합니다.
//
// size 를 주지 않으면 CSS 에서 크기를 정합니다.
// ============================================================

import { LAYER_ORDER, partUrl } from '../character/parts.js';

export default function CharacterView({ character, size, withBackground = true, className = '' }) {
  if (!character) return null;

  const style = {};
  if (size !== undefined) {
    style.width = size;
    style.height = size;
  }
  if (withBackground) style.background = character.background;

  return (
    <div className={`character ${withBackground ? 'character--card' : ''} ${className}`} style={style}>
      {LAYER_ORDER.map((layer) => (
        <img key={layer} src={partUrl(layer, character.parts[layer])} alt="" draggable="false" />
      ))}
    </div>
  );
}
