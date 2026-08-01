// ============================================================
// QR코드로 들어왔을 때 보게 되는 화면 (주로 방문자의 휴대폰)
// ============================================================

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Layout from '../components/Layout.jsx';
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

  const extension = photo?.fileName?.endsWith('.png') ? 'png' : 'jpg';

  return (
    <Layout>
      <div className="page page--center">
        {status === 'loading' && <span className="spinner" />}

        {status === 'error' && (
          <div className="stack stack--center">
            <p className="lead">사진을 찾을 수 없어요.</p>
            <Link className="button button--mint" to="/gallery">
              모카이빙 보기
            </Link>
          </div>
        )}

        {status === 'done' && (
          <div className="stack stack--center">
            <img className="photo-page__image" src={photo.imageUrl} alt={`${photo.name} 님의 모이모`} />

            <a
              className="button button--pink"
              href={photo.imageUrl}
              download={`moimo-${photo.name || photo.id}.${extension}`}
            >
              저장하기
            </a>
            <p className="hint">버튼이 안 되면 사진을 길게 눌러 저장해 주세요.</p>

            <Link className="button button--mint" to="/gallery">
              모카이빙 보기
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
