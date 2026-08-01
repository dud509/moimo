// ============================================================
// 캐릭터 결과 화면 (피그마 Desktop-9)
//
// 태블릿 안에 완성된 모이모가 등장하고,
// 아래에 출력하기 / 공유하기, 오른쪽에 세로 메뉴가 붙습니다.
// 캐릭터는 만들어지는 즉시 모카이빙에 보관됩니다.
// ============================================================

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';
import SideMenu from '../components/SideMenu.jsx';
import ShareModal from '../components/ShareModal.jsx';
import CharacterView from '../components/CharacterView.jsx';
import { composeCharacterCard } from '../character/draw.js';
import { useArchive } from '../lib/useArchive.js';
import { useSession } from '../SessionContext.jsx';

export default function CharacterPage() {
  const { session } = useSession();
  const [cardImage, setCardImage] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  const character = session.character;

  // 화면이 열리면 저장·공유에 쓸 카드 이미지를 미리 만들어 둡니다.
  useEffect(() => {
    if (!character) return;
    let cancelled = false;
    composeCharacterCard(character)
      .then((image) => !cancelled && setCardImage(image))
      .catch((error) => console.error(error));
    return () => {
      cancelled = true;
    };
  }, [character]);

  const archive = useArchive({
    imageDataUrl: cardImage,
    name: character?.name,
    character,
    kind: 'character',
  });

  // 이름을 입력하지 않고 이 주소로 바로 들어온 경우 이름 입력으로 보냅니다.
  if (!character) return <Navigate to="/name" replace />;

  function handlePrint() {
    if (!cardImage) return;
    const link = document.createElement('a');
    link.href = cardImage;
    link.download = `moimo-${character.name || '모이모'}.png`;
    link.click();
  }

  return (
    <Layout>
      <div className="with-side-menu">
        <Tablet>
          <div className="character-screen">
            <CharacterView character={character} withBackground={false} className="character-screen__figure" />

            <p className="character-screen__name">
              {character.title} {character.name}
            </p>

            <div className="button-row">
              <button className="button button--mint" type="button" onClick={handlePrint} disabled={!cardImage}>
                출력하기
              </button>
              <button className="button button--pink" type="button" onClick={() => setShareOpen(true)}>
                공유하기
              </button>
            </div>
          </div>
        </Tablet>

        <SideMenu />
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        archive={archive}
        imageDataUrl={cardImage}
      />
    </Layout>
  );
}
