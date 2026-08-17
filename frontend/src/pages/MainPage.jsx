// ============================================================
// 메인 화면 (피그마 Desktop-2)
//
// 책상 위에 놓인 물건들에 마우스를 올리면 살짝 커지면서 이름표가 뜹니다.
// 눌렀을 때 가는 곳:
//   다이어리   → 이름 입력 (캐릭터 만들기)
//   카메라     → 같이 사진 찍기
//   폴라로이드 → 모카이빙 (갤러리)
//   쇼핑백     → 모이모 굿즈
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import { useSession } from '../SessionContext.jsx';

// 피그마 시안(background.svg) 크기와 하늘색 띠 높이입니다.
const FRAME = { width: 2560, height: 1440, bandTop: 244, bandBottom: 64 };
const DESK_HEIGHT = FRAME.height - FRAME.bandTop - FRAME.bandBottom; // 1132

// ------------------------------------------------------------
// ★ 아래 x, y, w 는 전부 "피그마에 뜨는 숫자 그대로" 입니다.
//
//   피그마에서 물건을 클릭하면 오른쪽 패널에 X · Y · W · H 가 나옵니다.
//   그 숫자를 그냥 옮겨 적으세요. % 계산은 아래 place() 가 알아서 합니다.
//
//   x, y : 물건의 왼쪽 위 모서리 (피그마 프레임 기준)
//   w    : 물건의 가로 크기
//   tilt : 기울기(도). 그림에 이미 기울기가 들어있으면 0 으로 둡니다.
//
//   hover: 마우스를 올렸을 때 대신 보여줄 그림입니다.
//          캐릭터와 흰 테두리까지 전부 그려진 한 장이라, 평소 그림보다 큽니다.
//          그래서 자리(x, y, w)를 따로 적습니다. 역시 피그마 숫자 그대로입니다.
//          아직 그림이 없으면 hover 줄을 지우면 됩니다. (그냥 안 바뀝니다)
// ------------------------------------------------------------
const OBJECTS = [
  {
    key: 'diary',
    label: '모이모 만나기',
    image: '/ui/diary.svg',
    to: '/name',
    x: 242,
    y: 458,
    w: 697,
    tilt: 0,
    hover: { image: '/ui/diary-hover.svg', x: 217, y: 375, w: 755 },
  },
  {
    key: 'camera',
    label: '같이 사진 찍기',
    image: '/ui/camera.svg',
    to: '/capture',
    needsCharacter: true,
    x: 1680,
    y: 336,
    w: 319,
    tilt: 0,
    hover: { image: '/ui/camera-hover.svg', x: 1652, y: 309, w: 374 },
  },
  {
    key: 'polaroid',
    label: '모카이빙',
    image: '/ui/polaroid.svg',
    to: '/gallery',
    x: 1232,
    y: 625,
    w: 319,
    tilt: 0,
    hover: { image: '/ui/polaroid-hover.svg', x: 1206, y: 587, w: 372 },
  },
  {
    key: 'bag',
    label: '모이모 굿즈',
    image: '/ui/bag.svg',
    to: '/goods',
    x: 1577,
    y: 929,
    w: 359,
    tilt: 0,
    hover: { image: '/ui/bag-hover.svg', x: 1457, y: 901, w: 506 },
  },
];

// 누르는 물건은 아니고, 화면 오른쪽 아래 모서리에 붙어 있는 그림들입니다.
// 말풍선 그림 안에는 글자가 이미 그려져 있어서 따로 글씨를 얹지 않습니다.
//
// ★ 이 둘만 무대 기준이 아니라 "창 모서리 기준"으로 놓습니다.
//   그래서 화면 비율을 어떻게 바꿔도 오른쪽 아래 같은 자리를 지킵니다.
//     right  : 시안 오른쪽 끝(2560)에서 그림 오른쪽 끝까지의 거리
//     bottom : 아래 하늘색 띠 위쪽(1376)에서 그림 아래쪽 끝까지의 거리
//              (창 높이가 바뀌어도 띠에 붙어 있으므로 자리가 안 변합니다)
const CORNER_DECOR = [
  { key: 'bubble', image: '/ui/speechbubble.svg', right: 197, bottom: 203, w: 259 },
  { key: 'mascot', image: '/ui/mascot.svg', right: 30, bottom: 32, w: 169, bob: true },
];

// 오른쪽 아래 모서리 기준으로 놓습니다. (숫자는 전부 시안 px)
function pinToCorner({ right, bottom, w }) {
  return { right: `${right}px`, bottom: `${bottom}px`, width: `${w}px` };
}

// 피그마 좌표를 화면 위치(%)로 바꿉니다.
function place({ x, y, w }) {
  return {
    left: `${(x / FRAME.width) * 100}%`,
    top: `${((y - FRAME.bandTop) / DESK_HEIGHT) * 100}%`,
    width: `${(w / FRAME.width) * 100}%`,
  };
}

export default function MainPage() {
  const navigate = useNavigate();
  const { session } = useSession();

  // 지금 마우스가 올라가 있는 물건의 key 입니다.
  const [hovered, setHovered] = useState(null);

  // 교체 그림을 다 불러온 물건들입니다.
  // 다 불러온 뒤에만 그림을 바꿔야, 첫 호버에서 잠깐 아무것도 없는 상태가 생기지 않습니다.
  const [readyArt, setReadyArt] = useState(() => new Set());

  // 교체 그림 파일이 아직 없는 물건들입니다. 이 경우 평소 그림을 그대로 둡니다.
  const [missingArt, setMissingArt] = useState(() => new Set());

  function markReady(key) {
    setReadyArt((keys) => new Set(keys).add(key));
  }

  function markMissing(key) {
    setMissingArt((keys) => new Set(keys).add(key));
  }

  function handleClick(object) {
    // 아직 캐릭터가 없는데 사진부터 찍으려 하면 이름 입력으로 먼저 보냅니다.
    if (object.needsCharacter && !session.character) {
      navigate('/name');
      return;
    }
    navigate(object.to);
  }

  return (
    <Layout>
      <div className="desk">
        {/* 물건들은 시안 크기(2560×1132) 상자 안에 놓입니다. */}
        <div className="desk__scene">
          {OBJECTS.map((object) => {
            // 교체 그림을 다 불러왔을 때만 평소 그림을 숨깁니다.
            const swapped = hovered === object.key && readyArt.has(object.key);

            return (
              <button
                key={object.key}
                className={`desk__object ${swapped ? 'desk__object--swapped' : ''}`}
                type="button"
                style={{ ...place(object), '--tilt': `${object.tilt}deg` }}
                onClick={() => handleClick(object)}
                onMouseEnter={() => setHovered(object.key)}
                onMouseLeave={() => setHovered((key) => (key === object.key ? null : key))}
                onFocus={() => setHovered(object.key)}
                onBlur={() => setHovered((key) => (key === object.key ? null : key))}
              >
                <img src={object.image} alt={object.label} />
              </button>
            );
          })}

          {/* 마우스를 올렸을 때 나오는 그림 (캐릭터 + 흰 테두리가 함께 그려진 한 장).
            평소 그림보다 커서 버튼 밖으로 나오므로 책상 위에 따로 놓습니다.
            물건 이름은 그림 속 캐릭터가 대신 알려주므로 따로 적지 않습니다.
            (누르는 곳이 어디인지는 알림용 alt 로 전달됩니다)

            ★ 화면이 열릴 때 미리 다 불러둡니다. 마우스를 올린 순간에 불러오면
              그림이 도착할 때까지 물건이 사라져 보이기 때문입니다. */}
          {OBJECTS.filter((object) => object.hover && !missingArt.has(object.key)).map((object) => (
            <div
              key={object.key}
              className={`desk__hover ${hovered === object.key ? 'desk__hover--on' : ''}`}
              style={place(object.hover)}
            >
              <img
                src={object.hover.image}
                onLoad={() => markReady(object.key)}
                onError={() => markMissing(object.key)}
                alt=""
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        {/* 마스코트·말풍선은 물건 상자가 아니라 아래 하늘색 띠 기준으로 붙습니다.
            그래서 창 높이가 바뀌어도 오른쪽 아래 같은 자리를 지킵니다. */}
        <div className="corner-decor" aria-hidden="true">
          {CORNER_DECOR.map((item) => (
            <img
              key={item.key}
              className={`corner-decor__item ${item.bob ? 'corner-decor__item--bob' : ''}`}
              src={item.image}
              style={pinToCorner(item)}
              alt=""
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
