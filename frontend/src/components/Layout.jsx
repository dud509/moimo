// ============================================================
// 모든 화면이 공통으로 쓰는 틀
//
//   ┌──────────────────────────┐
//   │ ☰      moimo 로고        │  ← 하늘색 띠
//   ├──────────────────────────┤
//   │                          │
//   │   (여기에 화면 내용)      │  ← 크림색 물방울 배경
//   │                          │
//   ├──────────────────────────┤
//   │                          │  ← 하늘색 띠
//   └──────────────────────────┘
// ============================================================

import { Link } from 'react-router-dom';

export default function Layout({ children, onMenuClick }) {
  return (
    <div className="app">
      <header className="app__header">
        <button
          className="hamburger"
          type="button"
          aria-label="메뉴"
          onClick={onMenuClick}
        >
          <span />
          <span />
          <span />
        </button>

        <Link to="/" className="app__logo" aria-label="모이모 홈">
          <img src="/ui/logo.svg" alt="moimo" />
        </Link>
      </header>

      <div className="app__body">{children}</div>

      <footer className="app__footer" />
    </div>
  );
}
