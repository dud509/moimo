// ============================================================
// 어떤 주소로 들어오면 어떤 화면을 보여줄지 정하는 파일
//
//   /          → 메인 화면 (책상)
//   /old       → 예전 메인 화면 (비교용, 정해지면 지웁니다) · 피그마 Desktop-2
//   /name      → 이름 입력                 · 피그마 Desktop-7
//   /character → 캐릭터 결과               · 피그마 Desktop-9
//   /capture   → 같이 사진 찍기
//   /result    → 사진 결과
//   /gallery   → 모카이빙
//   /goods     → 모이모 굿즈 (디자인 대기 중)
//   /p/사진번호 → QR로 들어왔을 때 보는 화면
// ============================================================

import { Navigate, Route, Routes } from 'react-router-dom';

import MainPage from './pages/MainPage.jsx';
import MainPageNew from './pages/MainPageNew.jsx';
import NamePage from './pages/NamePage.jsx';
import CharacterPage from './pages/CharacterPage.jsx';
import CapturePage from './pages/CapturePage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import GoodsPage from './pages/GoodsPage.jsx';
import PhotoPage from './pages/PhotoPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPageNew />} />
      {/* 예전 메인 화면. 비교하려고 남겨둔 것이니, 정해지면 이 줄과 파일을 지우면 됩니다. */}
      <Route path="/old" element={<MainPage />} />
      <Route path="/name" element={<NamePage />} />
      <Route path="/character" element={<CharacterPage />} />
      <Route path="/capture" element={<CapturePage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/goods" element={<GoodsPage />} />
      <Route path="/p/:id" element={<PhotoPage />} />
      {/* 주소를 잘못 입력하면 메인 화면으로 보냅니다. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
