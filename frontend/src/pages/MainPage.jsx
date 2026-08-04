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

import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import { useSession } from '../SessionContext.jsx';

// 피그마 시안(background.svg)의 가로 크기입니다. 물건 크기를 이 값으로 나눠서 %로 씁니다.
const FRAME_WIDTH = 2560;

// ------------------------------------------------------------
// width  : 피그마에서 내보낸 그림 파일의 "원래 가로 크기"를 그대로 적습니다.
//          (터미널에서 `head -c 100 파일.svg` 하면 width="697" 처럼 보입니다)
//          이 값을 쓰면 시안과 크기가 정확히 같아집니다. 눈대중 금지!
// center : 물건의 "한가운데"가 놓일 자리입니다. 책상 영역 기준 %입니다.
//          x 0=왼쪽끝 100=오른쪽끝, y 0=하늘색 띠 바로 아래 100=아래 띠 바로 위
// tilt   : 기울기(도)
// ------------------------------------------------------------
const OBJECTS = [
  {
    key: 'diary',
    label: '모이모 만나기',
    image: '/ui/diary.svg',
    to: '/name',
    width: 697,
    center: { x: 28.5, y: 53.6 },
    tilt: -6,
  },
  {
    key: 'camera',
    label: '같이 사진 찍기',
    image: '/ui/camera.svg',
    to: '/capture',
    needsCharacter: true,
    width: 319,
    center: { x: 71.5, y: 30.3 },
    tilt: 5,
  },
  {
    key: 'polaroid',
    label: '모카이빙',
    image: '/ui/polaroid.svg',
    to: '/gallery',
    width: 319,
    center: { x: 56.5, y: 58.5 },
    tilt: -3,
  },
  {
    key: 'bag',
    label: '모이모 굿즈',
    image: '/ui/bag.svg',
    to: '/goods',
    width: 359,
    center: { x: 69.5, y: 79 },
    tilt: 4,
  },
];

export default function MainPage() {
  const navigate = useNavigate();
  const { session } = useSession();

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
        {OBJECTS.map((object) => (
          <button
            key={object.key}
            className="desk__object"
            type="button"
            style={{
              left: `${object.center.x}%`,
              top: `${object.center.y}%`,
              width: `${(object.width / FRAME_WIDTH) * 100}%`,
              '--tilt': `${object.tilt}deg`,
            }}
            onClick={() => handleClick(object)}
          >
            <img src={object.image} alt={object.label} />
            <span className="desk__label">{object.label}</span>
          </button>
        ))}

        <div className="desk__mascot">
          <p className="speech-bubble">
            <img src="/ui/speechbubble.svg" alt="" aria-hidden="true" />
            <span className="speech-bubble__text">마우스를 올려바!</span>
          </p>
          <img src="/ui/mascot.svg" alt="" />
        </div>
      </div>
    </Layout>
  );
}
