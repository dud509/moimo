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

import useStageScale from '../lib/useStageScale.js';

// stage=false 로 주면 시안 고정 크기를 쓰지 않고 화면 크기를 그대로 따릅니다.
// (QR 로 들어온 휴대폰 화면에서 씁니다)
export default function Layout({ children, onMenuClick, stage = true }) {
  // 시안(2560×1440)을 화면 크기에 맞춰 통째로 확대·축소합니다.
  useStageScale();

  return (
    <>
      {/* 배경은 창 전체를 채웁니다. 화면 비율이 시안(16:9)과 달라도
          하늘색은 하늘색으로, 물방울 바탕은 물방울로 이어집니다.
          안쪽 크림 칸의 자리는 무대 배율(--fit)에 맞춰 CSS 가 계산합니다. */}
      {stage && (
        <div className="app-backdrop" aria-hidden="true">
          <div className="app-backdrop__field" />
        </div>
      )}

      <div className={`app ${stage ? 'app--stage' : ''}`}>
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
    </>
  );
}
