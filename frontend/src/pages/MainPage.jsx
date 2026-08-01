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

// 물건마다 놓이는 자리(%)와 크기(%)입니다. 위치를 옮기고 싶으면 이 숫자만 고치세요.
const OBJECTS = [
  {
    key: 'diary',
    label: '모이모 만나기',
    image: '/ui/diary.svg',
    // 마우스를 올리면 펼쳐진 다이어리로 바뀝니다.
    hoverImage: '/ui/diary2.svg',
    to: '/name',
    style: { left: '17%', top: '28%', width: '23%' },
    tilt: -6,
  },
  {
    key: 'camera',
    label: '같이 사진 찍기',
    image: '/ui/camera.svg',
    to: '/capture',
    needsCharacter: true,
    style: { left: '63%', top: '10%', width: '17%' },
    tilt: 5,
  },
  {
    key: 'polaroid',
    label: '모카이빙',
    image: '/ui/polaroid.svg',
    to: '/gallery',
    style: { left: '49%', top: '40%', width: '15%' },
    tilt: -3,
  },
  {
    key: 'bag',
    label: '모이모 굿즈',
    image: '/ui/bag.svg',
    to: '/goods',
    style: { left: '62%', top: '62%', width: '15%' },
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
            style={{ ...object.style, '--tilt': `${object.tilt}deg` }}
            onClick={() => handleClick(object)}
          >
            <img src={object.image} alt={object.label} />
            {object.hoverImage && (
              <img className="desk__object-hover" src={object.hoverImage} alt="" aria-hidden="true" />
            )}
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
