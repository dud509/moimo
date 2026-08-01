// ============================================================
// 그림이 준비되면 자동으로 한 번만 창고에 보관해 주는 도구
//
// 캐릭터 카드든 사진이든, 만들어지는 즉시 모카이빙에 쌓입니다.
// 이미 보관한 것을 다시 보내지 않도록 안에서 막아 둡니다.
// ============================================================

import { useEffect, useRef, useState } from 'react';

import { photoShareUrl, uploadPhoto } from '../api.js';

export function useArchive({ imageDataUrl, name, character, kind }) {
  const [status, setStatus] = useState('waiting'); // waiting | saving | done | error
  const [shareUrl, setShareUrl] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!imageDataUrl || startedRef.current) return;
    startedRef.current = true;
    setStatus('saving');

    (async () => {
      try {
        const saved = await uploadPhoto({ name, character, imageDataUrl, kind });
        setShareUrl(photoShareUrl(saved.id));
        setStatus('done');
      } catch (error) {
        console.error(error);
        setStatus('error');
      }
    })();
  }, [imageDataUrl, name, character, kind]);

  return { status, shareUrl };
}
