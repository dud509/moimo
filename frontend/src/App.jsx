// ============================================================
// 어떤 주소로 들어오면 어떤 화면을 보여줄지 정하는 파일
//
//   /          → 이름 입력 화면      (전시장 첫 화면)
//   /character → 캐릭터 등장 화면
//   /capture   → 사진 찍는 화면
//   /result    → 결과 + QR코드 화면
//   /gallery   → 모두의 모이모 갤러리
//   /p/사진번호 → QR코드로 들어왔을 때 보는 사진 한 장
// ============================================================

import { Navigate, Route, Routes } from 'react-router-dom';

import NamePage from './pages/NamePage.jsx';
import CharacterPage from './pages/CharacterPage.jsx';
import CapturePage from './pages/CapturePage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import PhotoPage from './pages/PhotoPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<NamePage />} />
      <Route path="/character" element={<CharacterPage />} />
      <Route path="/capture" element={<CapturePage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/p/:id" element={<PhotoPage />} />
      {/* 주소를 잘못 입력하면 첫 화면으로 보냅니다. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
