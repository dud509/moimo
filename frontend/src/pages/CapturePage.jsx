// ============================================================
// 3번째 화면 : 웹캠으로 사진 찍기
//
// 화면에 보이는 모습 그대로 사진이 찍히도록,
// 미리보기와 실제 사진의 캐릭터 위치를 똑같이 맞춰 두었습니다.
// (위치를 바꾸고 싶다면 이 파일과 character/draw.js 를 함께 고쳐 주세요.)
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

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

  // ------------------------------------------------------------
  // 웹캠 켜기
  // ------------------------------------------------------------
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
          ? '카메라 사용이 거부되었어요. 브라우저 주소창의 카메라 아이콘을 눌러 허용해 주세요.'
          : '카메라를 찾을 수 없어요. 웹캠이 연결되어 있는지 확인해 주세요.',
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    // 화면을 떠날 때 웹캠을 반드시 꺼 줍니다.
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [startCamera]);

  // ------------------------------------------------------------
  // 3, 2, 1 세고 나서 찰칵
  // ------------------------------------------------------------
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
      // 셔터가 터지는 느낌을 잠깐 보여준 뒤 결과 화면으로 넘어갑니다.
      setTimeout(() => navigate('/result'), 320);
    } catch (error) {
      console.error(error);
      setCameraError('사진을 만드는 중에 문제가 생겼어요. 다시 시도해 주세요.');
      setCountdown(null);
      setFlash(false);
      setBusy(false);
    }
  }

  if (!session.character) return <Navigate to="/" replace />;

  return (
    <main className="screen capture-page">
      <h2 className="title title--small">
        {session.character.name} 님, 모이모와 함께 찍어요
      </h2>

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

        {/* 사진에 찍힐 위치와 똑같은 자리에 캐릭터를 얹어 둡니다. */}
        <div className="stage__character">
          <CharacterView character={session.character} size="100%" withBackground={false} />
        </div>

        {countdown > 0 && <div className="countdown">{countdown}</div>}
        {flash && <div className="flash" />}

        {cameraError && (
          <div className="stage__message">
            <p>{cameraError}</p>
            <button className="button button--primary" type="button" onClick={startCamera}>
              카메라 다시 연결하기
            </button>
          </div>
        )}
      </div>

      <div className="button-row">
        <button className="button button--ghost" type="button" onClick={() => navigate('/character')}>
          뒤로
        </button>
        <button
          className="button button--primary button--shutter"
          type="button"
          onClick={() => setCountdown(3)}
          disabled={!ready || busy || countdown !== null || Boolean(cameraError)}
        >
          {countdown !== null ? '찍는 중…' : '사진 찍기'}
        </button>
      </div>
    </main>
  );
}
