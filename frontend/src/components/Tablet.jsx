// ============================================================
// 펼쳐진 다이어리 (화면 내용이 들어가는 틀)
//
// 틀은 피그마에서 내보낸 diary2.svg 그림 그대로이고,
// 그 안쪽 흰 종이 자리에 화면 내용을 얹습니다.
// showHome 을 켜면 왼쪽에 동그란 홈 버튼이 함께 나옵니다.
//
// 자리 계산은 src/lib/layout.js 가 합니다.
// ============================================================

import { Link } from 'react-router-dom';

import { TABLET, onDesk } from '../lib/layout.js';

// 홈 버튼 자리 (피그마 좌표). home.svg 는 동그라미 테두리까지 그림에 들어있습니다.
const HOME = { x: 550, y: 383, w: 65 };

export default function Tablet({ children, showHome = true }) {
  return (
    <div className="tablet-area">
      {showHome && (
        <Link className="home-button" to="/" aria-label="처음으로" style={onDesk(HOME)}>
          <img src="/ui/home.svg" alt="" />
        </Link>
      )}

      <div className="tablet" style={onDesk(TABLET)}>
        <img className="tablet__frame" src="/ui/diary2.svg" alt="" aria-hidden="true" />
        <div className="tablet__screen">{children}</div>
      </div>
    </div>
  );
}
