// ============================================================
// 모든 화면이 공통으로 쓰는 틀
//
//   ┌──────────────────────────┐
//   │        moimo 로고        │
//   │                          │
//   │   (여기에 화면 내용)      │  ← 배경은 메인 화면과 같은 책상 그림
//   │                          │
//   └──────────────────────────┘
//
// 배경(main-bg.svg)은 창을 꽉 채우고, 남는 만큼 가장자리가 잘립니다.
// 메인 화면과 똑같은 방식이라 화면이 바뀌어도 책상이 이어져 보입니다.
// ============================================================

import { Link } from 'react-router-dom';

// stage=false 로 주면 시안 고정 크기를 쓰지 않고 화면 크기를 그대로 따릅니다.
// (QR 로 들어온 휴대폰 화면에서 씁니다)
//
// desk=false 로 주면 배경이 예전 방식(하늘색 띠 + 물방울)으로 돌아갑니다.
// 비교용으로 남겨둔 예전 메인 화면(/old)만 이걸 씁니다.
export default function Layout({ children, stage = true, desk = true }) {
  return (
    <div className={`app ${stage ? 'app--stage' : ''} ${stage && desk ? 'app--desk' : ''}`}>
      <header className="app__header">
        <Link to="/" className="app__logo" aria-label="모이모 홈">
          <img src="/ui/logo.svg" alt="moimo" />
        </Link>
      </header>

      <div className="app__body">{children}</div>

      <footer className="app__footer" />
    </div>
  );
}
