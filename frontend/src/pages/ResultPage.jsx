// ============================================================
// 사진 결과 화면
//
// 캐릭터 결과 화면(Desktop-9)과 같은 모양으로,
// 태블릿 안에 찍은 사진이 들어갑니다.
// ============================================================

import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';
import SideMenu from '../components/SideMenu.jsx';
import ShareModal from '../components/ShareModal.jsx';
import { useArchive } from '../lib/useArchive.js';
import { useSession } from '../SessionContext.jsx';

// 아무도 조작하지 않으면 이 시간 뒤에 메인 화면으로 돌아갑니다. (다음 방문자를 위해)
const AUTO_RESET_SECONDS = 120;

export default function ResultPage() {
  const { session, reset } = useSession();
  const navigate = useNavigate();

  const [shareOpen, setShareOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);

  // 찍은 사진은 화면이 열리는 즉시 모카이빙에 보관됩니다.
  const archive = useArchive({
    imageDataUrl: session.photo,
    name: session.name,
    character: session.character,
    kind: 'photo',
  });

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) return;
    reset();
    navigate('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (!session.photo) return <Navigate to="/" replace />;

  function handleDownload() {
    const link = document.createElement('a');
    link.href = session.photo;
    link.download = `moimo-${session.name || '사진'}.jpg`;
    link.click();
  }

  return (
    <Layout>
      <div className="with-side-menu">
        <Tablet>
          <div className="character-screen">
            <img className="result-photo" src={session.photo} alt="모이모와 함께 찍은 사진" />

            <div className="button-row">
              <button className="button button--mint" type="button" onClick={handleDownload}>
                출력하기
              </button>
              <button className="button button--pink" type="button" onClick={() => setShareOpen(true)}>
                공유하기
              </button>
            </div>

            <p className="hint">{secondsLeft}초 뒤 처음 화면으로 돌아가요</p>
          </div>
        </Tablet>

        <SideMenu />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        archive={archive}
        imageDataUrl={session.photo}
      />
    </Layout>
  );
}
