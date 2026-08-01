// ============================================================
// 4번째 화면 : 완성된 사진 + QR코드
//
// 화면이 열리면 자동으로 사진을 창고에 저장하고,
// 방문자가 폰으로 찍어갈 수 있는 QR코드를 보여줍니다.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

import { photoShareUrl, uploadPhoto } from '../api.js';
import { useSession } from '../SessionContext.jsx';

// 아무도 조작하지 않으면 이 시간 뒤에 첫 화면으로 돌아갑니다. (다음 방문자를 위해)
const AUTO_RESET_SECONDS = 90;

export default function ResultPage() {
  const { session, reset } = useSession();
  const navigate = useNavigate();

  const [status, setStatus] = useState('saving'); // saving | done | error
  const [shareUrl, setShareUrl] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);
  const uploadedRef = useRef(false);

  // ------------------------------------------------------------
  // 사진 저장 + QR코드 만들기 (화면이 열릴 때 한 번만)
  // ------------------------------------------------------------
  useEffect(() => {
    if (!session.photo || uploadedRef.current) return;
    uploadedRef.current = true;

    (async () => {
      try {
        const saved = await uploadPhoto({
          name: session.name,
          character: session.character,
          imageDataUrl: session.photo,
        });
        const url = photoShareUrl(saved.id);
        setShareUrl(url);
        setQrImage(
          await QRCode.toDataURL(url, { width: 520, margin: 1, color: { dark: '#3A3330', light: '#FFFFFF' } }),
        );
        setStatus('done');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    })();
  }, [session]);

  // ------------------------------------------------------------
  // 자동으로 처음 화면으로 돌아가기
  // ------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) startOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function startOver() {
    reset();
    navigate('/');
  }

  if (!session.photo) return <Navigate to="/" replace />;

  return (
    <main className="screen result-page">
      <h2 className="title title--small">완성되었어요!</h2>

      <div className="result-layout">
        <img className="result-photo" src={session.photo} alt="모이모와 함께 찍은 사진" />

        <aside className="result-side">
          {status === 'saving' && (
            <div className="qr-box qr-box--loading">
              <span className="spinner" />
              <p>사진을 보관하는 중…</p>
            </div>
          )}

          {status === 'done' && (
            <div className="qr-box">
              <img className="qr-image" src={qrImage} alt="사진을 받아갈 수 있는 QR코드" />
              <p className="qr-guide">
                <strong>휴대폰 카메라로 찍어 주세요</strong>
                <br />
                사진을 바로 저장할 수 있어요.
              </p>
              <a className="qr-url" href={shareUrl} target="_blank" rel="noreferrer">
                {shareUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="qr-box qr-box--error">
              <p>
                사진을 보관하지 못했어요.
                <br />
                아래 버튼으로 바로 저장할 수 있어요.
              </p>
              <a className="button button--primary" href={session.photo} download="moimo.jpg">
                사진 저장하기
              </a>
            </div>
          )}

          <div className="stack">
            <button className="button button--primary" type="button" onClick={startOver}>
              다음 사람 시작하기
            </button>
            <button className="button button--ghost" type="button" onClick={() => navigate('/gallery')}>
              모두의 모이모 보기
            </button>
            <p className="hint">{secondsLeft}초 뒤 자동으로 처음 화면으로 돌아갑니다.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
