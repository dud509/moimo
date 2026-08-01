// ============================================================
// 창고(서버)와 이야기하는 부분
// ============================================================

/** 사진을 창고에 저장합니다. 저장된 사진의 정보를 돌려줍니다. */
export async function uploadPhoto({ name, character, imageDataUrl }) {
  const response = await fetch('/api/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, character, imageDataUrl }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error || '사진을 저장하지 못했습니다.');
  }
  return response.json();
}

/** 갤러리에 보여줄 사진 목록을 가져옵니다. */
export async function fetchPhotos({ limit = 200, offset = 0 } = {}) {
  const response = await fetch(`/api/photos?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error('갤러리를 불러오지 못했습니다.');
  return response.json();
}

/** 사진 한 장의 정보를 가져옵니다. (QR코드로 접속했을 때 사용) */
export async function fetchPhoto(id) {
  const response = await fetch(`/api/photos/${id}`);
  if (!response.ok) throw new Error('사진을 찾을 수 없습니다.');
  return response.json();
}

/**
 * QR코드에 담을 주소를 만듭니다.
 * 기본은 현재 접속한 주소를 그대로 사용합니다.
 * 인터넷에 배포한 뒤에는 frontend/.env 파일에
 *   VITE_PUBLIC_URL=https://내주소.com
 * 처럼 적어주면 그 주소가 QR코드에 담깁니다.
 */
export function photoShareUrl(id) {
  const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/p/${id}`;
}
