// ============================================================
// 2번째 화면 : 캐릭터 등장
// ============================================================

import { Navigate, useNavigate } from 'react-router-dom';

import CharacterView from '../components/CharacterView.jsx';
import { useSession } from '../SessionContext.jsx';

export default function CharacterPage() {
  const { session, reset } = useSession();
  const navigate = useNavigate();

  // 이름을 입력하지 않고 이 주소로 바로 들어온 경우 첫 화면으로 보냅니다.
  if (!session.character) return <Navigate to="/" replace />;

  const { character } = session;

  function goBackToStart() {
    reset();
    navigate('/');
  }

  return (
    <main className="screen screen--center">
      <div className="stack stack--center reveal">
        <p className="eyebrow">{character.name} 님의 모이모</p>

        <CharacterView character={character} size={380} className="reveal__character" />

        <h2 className="title">
          {character.title} {character.name}의 모이모
        </h2>
        <p className="lead lead--small">
          이름에서 태어난 단 하나의 모습이에요.
          <br />
          이제 함께 사진을 찍어 볼까요?
        </p>

        <div className="button-row">
          <button className="button button--ghost" type="button" onClick={goBackToStart}>
            다시 입력하기
          </button>
          <button className="button button--primary" type="button" onClick={() => navigate('/capture')}>
            같이 사진 찍기
          </button>
        </div>
      </div>
    </main>
  );
}
