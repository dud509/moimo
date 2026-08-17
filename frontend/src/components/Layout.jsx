// ============================================================
// 모든 화면이 공통으로 쓰는 틀
//
//   ┌──────────────────────────┐
//   │        moimo 로고        │  ← 하늘색 띠
//   ├──────────────────────────┤
//   │                          │
//   │   (여기에 화면 내용)      │  ← 크림색 물방울 배경
//   │                          │
//   ├──────────────────────────┤
//   │                          │  ← 하늘색 띠
//   └──────────────────────────┘
// ============================================================

import { Link } from 'react-router-dom';

// stage=false 로 주면 시안 고정 크기를 쓰지 않고 화면 크기를 그대로 따릅니다.
// (QR 로 들어온 휴대폰 화면에서 씁니다)
export default function Layout({ children, stage = true }) {
  return (
    <div className={`app ${stage ? 'app--stage' : ''}`}>
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
