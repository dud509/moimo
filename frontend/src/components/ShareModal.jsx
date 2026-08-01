// ============================================================
// 공유하기 창 (QR코드)
//
// 보관이 끝나면 방문자가 폰으로 가져갈 수 있는 QR코드를 보여줍니다.
// 보관 자체는 useArchive 가 미리 해두기 때문에, 여기서는 보여주기만 합니다.
// ============================================================

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function ShareModal({ open, onClose, archive, imageDataUrl }) {
  const [qrImage, setQrImage] = useState('');

  useEffect(() => {
    if (!archive.shareUrl) return;
    QRCode.toDataURL(archive.shareUrl, {
      width: 520,
      margin: 1,
      color: { dark: '#7A6853', light: '#FFFFFF' },
    })
      .then(setQrImage)
      .catch((error) => console.error(error));
  }, [archive.shareUrl]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal__box" onClick={(event) => event.stopPropagation()}>
        <button className="modal__close" type="button" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {archive.status !== 'done' && archive.status !== 'error' && (
          <>
            <span className="spinner" />
            <p className="modal__text">보관하는 중이야…</p>
          </>
        )}

        {archive.status === 'done' && (
          <>
            <p className="modal__title">폰으로 찍어가!</p>
            {qrImage && <img className="qr-image" src={qrImage} alt="가져갈 수 있는 QR코드" />}
            <p className="modal__text">휴대폰 카메라로 QR을 비추면 저장할 수 있어요.</p>
            <a className="modal__url" href={archive.shareUrl} target="_blank" rel="noreferrer">
              {archive.shareUrl.replace(/^https?:\/\//, '')}
            </a>
          </>
        )}

        {archive.status === 'error' && (
          <>
            <p className="modal__title">앗, 보관에 실패했어</p>
            <p className="modal__text">아래 버튼으로 바로 저장할 수 있어요.</p>
            <a className="button button--pink" href={imageDataUrl} download="moimo.png">
              저장하기
            </a>
          </>
        )}
      </div>
    </div>
  );
}
