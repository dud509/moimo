// ============================================================
// 모이모 서버
//
// 하는 일은 딱 세 가지입니다.
//   1) 화면에서 보낸 사진을 받아 창고에 저장하기
//   2) 갤러리에 보여줄 사진 목록 알려주기
//   3) (전시 배포용) 완성된 화면 파일을 방문자에게 보여주기
// ============================================================

import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { UPLOAD_DIR, savePhoto, listPhotos, getPhoto, deletePhoto } from './storage.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// 관리자 비밀번호. 사진을 지울 때만 필요합니다.
// 배포할 때 환경변수 ADMIN_KEY 로 바꿔 주세요.
const ADMIN_KEY = process.env.ADMIN_KEY || 'moimo-admin';

const app = express();

// 사진 데이터는 용량이 크기 때문에 넉넉하게 받도록 설정합니다.
app.use(express.json({ limit: '25mb' }));

// 저장된 사진 이미지 파일을 웹에서 볼 수 있게 열어 줍니다. (예: /uploads/abc.jpg)
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d' }));

// ------------------------------------------------------------
// 1) 사진 저장하기
// ------------------------------------------------------------
app.post('/api/photos', (req, res) => {
  try {
    const { name, character, imageDataUrl } = req.body ?? {};
    const record = savePhoto({ name, character, imageDataUrl });
    console.log(`[저장] ${record.name || '이름없음'} → ${record.fileName}`);
    res.status(201).json(record);
  } catch (error) {
    console.error('[저장 실패]', error.message);
    res.status(400).json({ error: error.message });
  }
});

// ------------------------------------------------------------
// 2) 갤러리 목록 보여주기
// ------------------------------------------------------------
app.get('/api/photos', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const offset = Number(req.query.offset) || 0;
  res.json(listPhotos({ limit, offset }));
});

// QR코드로 들어온 사람이 자기 사진 한 장을 확인할 때
app.get('/api/photos/:id', (req, res) => {
  const photo = getPhoto(req.params.id);
  if (!photo) return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  res.json(photo);
});

// ------------------------------------------------------------
// 3) 관리자용 삭제 (실수로 찍힌 사진을 지울 때)
//    사용법: 주소 뒤에 ?key=비밀번호 를 붙여서 DELETE 요청
// ------------------------------------------------------------
app.delete('/api/photos/:id', (req, res) => {
  if (req.query.key !== ADMIN_KEY) {
    return res.status(403).json({ error: '관리자 비밀번호가 필요합니다.' });
  }
  const removed = deletePhoto(req.params.id);
  if (!removed) return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
  res.json({ ok: true });
});

// 서버가 살아있는지 확인하는 주소
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ------------------------------------------------------------
// 4) 완성된 화면 파일 보여주기 (전시장 배포용)
//    npm run build 를 한 뒤에만 동작합니다.
//    개발 중에는 프론트엔드(5173번)가 화면을 담당하므로 이 부분은 쓰이지 않습니다.
// ------------------------------------------------------------
const DIST_DIR = join(HERE, '..', 'frontend', 'dist');
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // 어떤 주소로 들어와도 (예: /gallery, /p/abc) 화면 앱이 뜨도록 합니다.
  app.get('*', (_req, res) => res.sendFile(join(DIST_DIR, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n🗄  모이모 창고(서버) 준비 완료 → http://localhost:${PORT}\n`);
});
