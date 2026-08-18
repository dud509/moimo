// ============================================================
// 같이 사진 찍는 화면
//
// 물결 무늬 카메라 프레임(camera-frame.svg) 안에 웹캠 화면이 들어가고,
// 오른쪽 아래에 모이모가 얹힙니다. 프레임 아래쪽 가운데의 동그란 버튼
// (camera-button.svg) 을 누르면 3초 뒤에 찍힙니다.
//
// 화면에 보이는 그대로 사진이 찍히도록 미리보기와 결과물의 비율·캐릭터
// 위치를 똑같이 맞춰 두었습니다.
// (위치를 바꾸려면 이 파일과 character/draw.js 를 함께 고쳐 주세요.)
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
import CharacterView from '../components/CharacterView.jsx';
import { composePhoto } from '../character/draw.js';
import { onDesk } from '../lib/layout.js';
import { useSession } from '../SessionContext.jsx';

// 홈 버튼 자리 (다른 화면과 같은 자리입니다)
const HOME = { x: 550, y: 383, w: 65 };

export default function CapturePage() {
  const { session, setPhoto } = useSession();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState(null);
  const [ready, setReady] = useState(false);
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
      <div className="capture">
        <Link className="home-button" to="/" aria-label="처음으로" style={onDesk(HOME)}>
          <img src="/ui/home.svg" alt="" />
        </Link>

        {/* 흰 카드와 물결 테두리(camera-frame.svg)는 배경으로 깔립니다. */}
        <div className="camera">
          {/* 웹캠 화면. 프레임 안쪽에 딱 맞게 들어갑니다. */}
          <div className="camera__view">
            <video
              ref={videoRef}
              className="camera__video"
              playsInline
              muted
              onLoadedMetadata={() => setReady(true)}
            />

            <div className="camera__character">
              <CharacterView character={session.character} size="100%" withBackground={false} />
            </div>

            {countdown > 0 && <div className="countdown">{countdown}</div>}
            {flash && <div className="flash" />}

            {cameraError && (
              <div className="camera__message">
                <p>{cameraError}</p>
                <button className="button button--pink" type="button" onClick={startCamera}>
                  다시 연결하기
                </button>
              </div>
            )}
          </div>

          {/* 사진 찍기 버튼. 흰 원과 테두리가 camera-button.svg 에 들어있어
              CSS 로 덧그리지 않고 그림을 그대로 씁니다. */}
          <button
            className="shutter"
            type="button"
            aria-label="사진 찍기"
            onClick={() => setCountdown(3)}
            disabled={!ready || busy || countdown !== null || Boolean(cameraError)}
          />
        </div>
      </div>
    </Layout>
  );
}
