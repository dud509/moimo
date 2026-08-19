// ============================================================
// 메인 화면 — 새 시안 (비교용, 주소: /new)
//
// 지금 쓰는 메인 화면(MainPage.jsx)과 나란히 놓고 고르려고 만든 것입니다.
// 정해지면 진 쪽을 지우면 됩니다.
//
// 지금 화면과 다른 점:
//   · 위아래 하늘색 띠와 로고가 없습니다. 배경 그림 한 장이 화면 전체입니다.
//   · 누를 수 있는 건 다이어리 하나뿐입니다.
//     나머지 소품(펜·종이·컵…)은 배경 그림에 같이 그려져 있어 눌리지 않습니다.
//   · 창 크기가 바뀌어도 크기가 변하지 않습니다.
//     시안(2560×1440)을 화면 가운데에 고정해 두고, 창이 작으면 가장자리가 잘립니다.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 시안 전체 크기
const FRAME = { w: 2560, h: 1440 };

// ------------------------------------------------------------
// 아래 x, y, w 는 피그마에 뜨는 숫자 그대로입니다.
// 자리를 옮기려면 이 숫자만 고치세요.
// ------------------------------------------------------------

// 누를 수 있는 유일한 물건
const DIARY = {
  image: '/ui/diary-new.svg',
  x: 721,
  y: 325,
  w: 967,
  // 마우스를 올렸을 때 바뀌는 그림 (흰 테두리 + 캐릭터가 같이 그려진 한 장)
  //
  // 이 x, y 는 피그마에서 받은 숫자가 아니라, 두 그림의 분홍 다이어리 면이
  // 정확히 겹치도록 재서 맞춘 값입니다. (그래야 마우스를 올릴 때 안 튑니다)
  // 피그마의 실제 좌표를 알려주시면 그 숫자로 바꾸면 됩니다.
  hover: { image: '/ui/diary-hover-new.svg', x: 683, y: 130, w: 1041 },
};

// 둥실둥실 떠 있는 그림들. 누르는 대상이 아닙니다.
const DECOR = [
  { key: 'bubble', image: '/ui/speechbubble.svg', x: 1136, y: 189, w: 166 },
  { key: 'mascot1', image: '/ui/mascot1.svg', x: 971, y: 225, w: 139, bob: true },
  { key: 'mascot2', image: '/ui/mascot2.svg', x: 1683, y: 921, w: 138, bob: true },
];

// 피그마 좌표를 그대로 씁니다. 무대가 시안 크기(2560×1440) 라서 계산이 필요 없습니다.
function place({ x, y, w }) {
  return { left: `${x}px`, top: `${y}px`, width: `${w}px` };
}

export default function MainPageNew() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [hoverReady, setHoverReady] = useState(false);

  // 교체 그림을 다 불러온 뒤에만 바꿉니다.
  // 안 그러면 첫 호버에서 다이어리가 잠깐 사라져 보입니다.
  const swapped = hovered && hoverReady;

  return (
    <div className="new-page">
      <div className="new-scene" style={{ width: FRAME.w, height: FRAME.h }}>
        <button
          className={`new-diary ${swapped ? 'new-diary--swapped' : ''}`}
          type="button"
          style={place(DIARY)}
          onClick={() => navigate('/name')}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          <img src={DIARY.image} alt="모이모 만나기" />
        </button>

        {/* 마우스를 올렸을 때 나오는 그림. 미리 불러두고 투명하게 숨겨 둡니다. */}
        <div
          className={`new-diary-hover ${swapped ? 'new-diary-hover--on' : ''}`}
          style={place(DIARY.hover)}
        >
          <img
            src={DIARY.hover.image}
            onLoad={() => setHoverReady(true)}
            alt=""
            aria-hidden="true"
          />
        </div>

        {DECOR.map((item) => (
          <img
            key={item.key}
            className={`new-decor ${item.bob ? 'new-decor--bob' : ''}`}
            src={item.image}
            style={place(item)}
            alt=""
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}
