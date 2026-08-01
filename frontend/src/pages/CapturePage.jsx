// ============================================================
// 같이 사진 찍는 화면
//
// 태블릿 안에 웹캠 화면이 들어가고, 오른쪽 아래에 모이모가 얹힙니다.
// 화면에 보이는 그대로 사진이 찍히도록 미리보기와 결과물의
// 캐릭터 위치를 똑같이 맞춰 두었습니다.
// (위치를 바꾸려면 이 파일과 character/draw.js 를 함께 고쳐 주세요.)
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';
import CharacterView from '../components/CharacterView.jsx';
import { composePhoto } from '../character/draw.js';
import { useSession } from '../SessionContext.jsx';

export default function CapturePage() {
  const { session, setPhoto } = useSession();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [ready, setReady] = useState(false);
  const [aspect, setAspect] = useState(16 / 9);
  const [countdown, setCountdown] = useState(null); // 3 → 2 → 1 → null
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error(error);
      setCameraError(
        error.name === 'NotAllowedError'
          ? '카메라 사용이 거부되었어요. 주소창의 카메라 아이콘을 눌러 허용해 주세요.'
          : '카메라를 찾을 수 없어요. 웹캠이 연결되어 있는지 확인해 주세요.',
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown === 0) {
      takePhoto();
      return undefined;
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  async function takePhoto() {
    if (busy || !videoRef.current) return;
    setBusy(true);
    setFlash(true);

    try {
      const dataUrl = await composePhoto({ video: videoRef.current, character: session.character });
      setPhoto(dataUrl);
      setTimeout(() => navigate('/result'), 320);
    } catch (error) {
      console.error(error);
      setCameraError('사진을 만드는 중에 문제가 생겼어요. 다시 시도해 주세요.');
      setCountdown(null);
      setFlash(false);
      setBusy(false);
    }
  }

  if (!session.character) return <Navigate to="/name" replace />;

  return (
    <Layout>
      <Tablet>
        <div className="capture-screen">
          <div className="stage" style={{ aspectRatio: String(aspect) }}>
            <video
              ref={videoRef}
              className="stage__video"
              playsInline
              muted
              onLoadedMetadata={(event) => {
                const { videoWidth, videoHeight } = event.currentTarget;
                if (videoWidth && videoHeight) setAspect(videoWidth / videoHeight);
                setReady(true);
              }}
            />

            <div className="stage__character">
              <CharacterView character={session.character} size="100%" withBackground={false} />
            </div>

            {countdown > 0 && <div className="countdown">{countdown}</div>}
            {flash && <div className="flash" />}

            {cameraError && (
              <div className="stage__message">
                <p>{cameraError}</p>
                <button className="button button--pink" type="button" onClick={startCamera}>
                  다시 연결하기
                </button>
              </div>
            )}
          </div>

          <div className="button-row">
            <button className="button button--mint" type="button" onClick={() => navigate('/character')}>
              뒤로
            </button>
            <button
              className="button button--pink"
              type="button"
              onClick={() => setCountdown(3)}
              disabled={!ready || busy || countdown !== null || Boolean(cameraError)}
            >
              {countdown !== null ? '찍는 중…' : '찰칵!'}
            </button>
          </div>
        </div>
      </Tablet>
    </Layout>
  );
}
