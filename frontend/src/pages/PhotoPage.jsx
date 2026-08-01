// ============================================================
// QR코드로 들어왔을 때 보게 되는 화면 (주로 방문자의 휴대폰)
// 사진 한 장과 저장 버튼을 보여줍니다.
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fetchPhoto } from '../api.js';

export default function PhotoPage() {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | done | error

  useEffect(() => {
    let cancelled = false;

    fetchPhoto(id)
      .then((data) => {
        if (cancelled) return;
        setPhoto(data);
        setStatus('done');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="screen screen--center photo-page">
      {status === 'loading' && <span className="spinner" />}

      {status === 'error' && (
        <div className="stack stack--center">
          <p className="lead">사진을 찾을 수 없어요.</p>
          <Link className="button button--ghost" to="/gallery">
            갤러리 보기
          </Link>
        </div>
      )}

      {status === 'done' && (
        <div className="stack stack--center">
          <p className="eyebrow">moimo</p>
          <img className="photo-page__image" src={photo.imageUrl} alt={`${photo.name} 님의 모이모`} />

          <a className="button button--primary" href={photo.imageUrl} download={`moimo-${photo.name || photo.id}.jpg`}>
            사진 저장하기
          </a>
          <p className="hint">
            버튼이 동작하지 않으면 사진을 길게 눌러 저장해 주세요.
          </p>

          <Link className="corner-link corner-link--static" to="/gallery">
            모두의 모이모 보기 →
          </Link>
        </div>
      )}
    </main>
  );
}
