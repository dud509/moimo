// ============================================================
// 핑크 태블릿 (화면 내용이 들어가는 장난감 액정 틀)
//
// showHome 을 켜면 왼쪽에 동그란 홈 버튼이 함께 나옵니다.
// ============================================================

import { Link } from 'react-router-dom';

export default function Tablet({ children, showHome = true, wide = false }) {
  return (
    <div className="tablet-area">
      {showHome && (
        <Link className="home-button" to="/" aria-label="처음으로">
          <img src="/ui/home.svg" alt="" />
        </Link>
      )}

      <div className={`tablet ${wide ? 'tablet--wide' : ''}`}>
        <div className="tablet__tab" aria-hidden="true" />
        <div className="tablet__screen">{children}</div>
      </div>
    </div>
  );
}
