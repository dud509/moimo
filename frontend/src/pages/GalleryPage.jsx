// ============================================================
// 모두의 모이모 갤러리 (공개)
// 전시장에 다녀간 사람들의 사진이 모이는 곳입니다.
// ============================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchPhotos } from '../api.js';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading'); // loading | done | error

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchPhotos({ limit: 200 });
        if (cancelled) return;
        setPhotos(data.items);
        setTotal(data.total);
        setStatus('done');
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus('error');
      }
    }

    load();
    // 전시장 벽면에 띄워둘 수 있도록 20초마다 새로 불러옵니다.
    const timer = setInterval(load, 20000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="screen gallery-page">
      <header className="gallery-header">
        <div>
          <p className="eyebrow">moimo archive</p>
          <h2 className="title title--small">모두의 모이모</h2>
          {status === 'done' && <p className="hint">지금까지 {total}마리의 모이모가 태어났어요.</p>}
        </div>
        <Link className="button button--ghost" to="/">
          처음으로
        </Link>
      </header>

      {status === 'loading' && (
        <div className="empty">
          <span className="spinner" />
        </div>
      )}

      {status === 'error' && (
        <div className="empty">
          <p>갤러리를 불러오지 못했어요. 서버가 켜져 있는지 확인해 주세요.</p>
        </div>
      )}

      {status === 'done' && photos.length === 0 && (
        <div className="empty">
          <p>아직 아무도 다녀가지 않았어요.
            <br />첫 번째 모이모의 주인공이 되어 주세요!</p>
        </div>
      )}

      <div className="gallery-grid">
        {photos.map((photo) => (
          <Link key={photo.id} className="gallery-item" to={`/p/${photo.id}`}>
            <img src={photo.imageUrl} alt={`${photo.name} 님의 모이모`} loading="lazy" />
          </Link>
        ))}
      </div>
    </main>
  );
}
