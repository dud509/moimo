// ============================================================
// 사진과 기록을 보관하는 "창고" 담당 파일
//
// 데이터베이스 프로그램을 따로 설치하지 않아도 되도록,
// 사진은 그냥 이미지 파일로, 기록은 photos.json 이라는 파일 하나에 저장합니다.
// (전시회 규모에서는 이 방식으로 충분합니다. 몇 천 명까지 문제 없어요.)
// ============================================================

import { randomBytes } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = join(HERE, 'data');
export const UPLOAD_DIR = join(DATA_DIR, 'uploads'); // 사진 이미지 파일이 쌓이는 폴더
const INDEX_FILE = join(DATA_DIR, 'photos.json'); // 누가 언제 찍었는지 적어두는 목록

// 폴더가 없으면 만들어 둡니다.
mkdirSync(UPLOAD_DIR, { recursive: true });

/** photos.json 을 읽어옵니다. 파일이 없거나 깨져 있으면 빈 목록으로 시작합니다. */
function readIndex() {
  if (!existsSync(INDEX_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(INDEX_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('[창고] photos.json 을 읽을 수 없어 빈 목록으로 시작합니다.');
    return [];
  }
}

/**
 * photos.json 을 저장합니다.
 * 임시 파일에 먼저 쓰고 이름을 바꾸는 방식이라, 저장 도중 문제가 생겨도
 * 기존 목록이 깨지지 않습니다.
 */
function writeIndex(list) {
  const tmp = `${INDEX_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(list, null, 2));
  renameSync(tmp, INDEX_FILE);
}

/** 사진마다 붙는 짧은 주소용 아이디를 만듭니다. 예: "lz3k9f-a7c1" */
function makeId() {
  return `${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;
}

/**
 * 화면에서 보낸 사진(dataURL 형식의 글자)을 실제 이미지 파일로 저장하고,
 * 목록에 한 줄 추가합니다.
 */
export function savePhoto({ name, character, imageDataUrl, kind = 'photo' }) {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/s.exec(imageDataUrl ?? '');
  if (!match) throw new Error('사진 형식이 올바르지 않습니다.');

  const [, format, base64] = match;
  const id = makeId();
  const fileName = `${id}.${format === 'jpeg' ? 'jpg' : 'png'}`;

  writeFileSync(join(UPLOAD_DIR, fileName), Buffer.from(base64, 'base64'));

  const record = {
    id,
    // 'character' = 캐릭터 카드, 'photo' = 웹캠으로 찍은 사진
    kind: kind === 'character' ? 'character' : 'photo',
    name: String(name ?? '').slice(0, 20),
    character: character ?? null,
    fileName,
    imageUrl: `/uploads/${fileName}`,
    createdAt: new Date().toISOString(),
  };

  const list = readIndex();
  list.push(record);
  writeIndex(list);

  return record;
}

/** 갤러리에 보여줄 목록입니다. 최근에 찍은 사진이 맨 앞에 옵니다. */
export function listPhotos({ limit = 200, offset = 0 } = {}) {
  const list = readIndex().reverse();
  return {
    total: list.length,
    items: list.slice(offset, offset + limit),
  };
}

/** QR코드로 접속했을 때 사진 한 장을 찾아옵니다. */
export function getPhoto(id) {
  return readIndex().find((photo) => photo.id === id) ?? null;
}

/** 관리자용: 사진 한 장을 지웁니다. */
export function deletePhoto(id) {
  const list = readIndex();
  const index = list.findIndex((photo) => photo.id === id);
  if (index === -1) return false;

  const [removed] = list.splice(index, 1);
  try {
    unlinkSync(join(UPLOAD_DIR, removed.fileName));
  } catch {
    // 이미 파일이 없어도 목록에서는 지웁니다.
  }
  writeIndex(list);
  return true;
}
