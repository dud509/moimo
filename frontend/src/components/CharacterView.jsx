// ============================================================
// 화면에 캐릭터를 보여주는 조각
// 그림 파일들을 같은 자리에 차곡차곡 겹쳐서 한 마리로 보이게 합니다.
// ============================================================

import { LAYER_ORDER, partUrl } from '../character/parts.js';

export default function CharacterView({ character, size = 320, withBackground = true, className = '' }) {
  if (!character) return null;

  return (
    <div
      className={`character ${withBackground ? 'character--card' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: withBackground ? character.background : 'transparent',
      }}
    >
      {LAYER_ORDER.map((layer) => (
        <img key={layer} src={partUrl(layer, character.parts[layer])} alt="" draggable="false" />
      ))}
    </div>
  );
}
