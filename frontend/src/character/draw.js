// ============================================================
// 사진 한 장 만들기 (웹캠 화면 + 캐릭터를 하나의 이미지로 합치기)
// ============================================================

import { characterImageUrls } from './generate.js';

// 같은 그림을 여러 번 불러오지 않도록 기억해 둡니다.
const imageCache = new Map();

/** 그림 파일 하나를 불러옵니다. */
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`그림을 불러오지 못했습니다: ${src}`));
    image.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

/** 캐릭터를 이루는 그림들을 겹치는 순서대로 모두 불러옵니다. */
export function loadCharacterImages(character) {
  return Promise.all(characterImageUrls(character).map(loadImage));
}

/** 불러온 그림들을 정사각형 영역에 차례로 겹쳐 그립니다. */
export function drawCharacter(ctx, images, x, y, size) {
  for (const image of images) {
    ctx.drawImage(image, x, y, size, size);
  }
}

/**
 * 웹캠 영상과 캐릭터를 합쳐 최종 사진을 만듭니다.
 * 돌려주는 값은 이미지 데이터가 담긴 긴 글자(dataURL)입니다.
 */
export async function composePhoto({ video, character }) {
  const images = await loadCharacterImages(character);

  // 글씨체가 다 준비된 뒤에 그려야 사진에 글씨가 제대로 나옵니다.
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // 글씨체를 못 불러와도 기본 글씨체로 계속 진행합니다.
    }
  }

  const WIDTH = 1280;
  const videoW = video.videoWidth || 1280;
  const videoH = video.videoHeight || 720;
  const photoH = Math.round((WIDTH * videoH) / videoW);
  const BAR_H = 130; // 아래쪽 이름표 칸의 높이
  const HEIGHT = photoH + BAR_H;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // 1) 웹캠 화면 (좌우를 뒤집어서 거울처럼 보이게 합니다)
  ctx.save();
  ctx.translate(WIDTH, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, WIDTH, photoH);
  ctx.restore();

  // 2) 캐릭터를 오른쪽 아래에 얹습니다.
  const size = Math.round(photoH * 0.55);
  drawCharacter(ctx, images, WIDTH - size - 24, photoH - size + 12, size);

  // 3) 아래쪽 이름표 칸
  ctx.fillStyle = character.background;
  ctx.fillRect(0, photoH, WIDTH, BAR_H);

  ctx.fillStyle = '#3A3330';
  ctx.textBaseline = 'middle';

  ctx.font = '600 46px Jua, "Gowun Dodum", sans-serif';
  ctx.textAlign = 'left';
  const label = character.name ? `${character.title} ${character.name}의 모이모` : '나의 모이모';
  ctx.fillText(label, 48, photoH + BAR_H / 2);

  ctx.font = '400 28px "Gowun Dodum", sans-serif';
  ctx.textAlign = 'right';
  ctx.globalAlpha = 0.6;
  ctx.fillText(formatDate(new Date()), WIDTH - 48, photoH + BAR_H / 2);
  ctx.globalAlpha = 1;

  // JPEG 로 저장하면 파일 크기가 작아서 저장과 전송이 빠릅니다.
  return canvas.toDataURL('image/jpeg', 0.92);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}. ${m}. ${d}  moimo`;
}
