// ============================================================
// 모이모 굿즈
//
// 아직 피그마 디자인이 없어서 자리만 잡아 둔 화면입니다.
// 디자인이 나오면 이 파일을 채우면 됩니다.
// ============================================================

import Layout from '../components/Layout.jsx';
import Tablet from '../components/Tablet.jsx';

export default function GoodsPage() {
  return (
    <Layout>
      <Tablet>
        <div className="character-screen">
          <img className="goods-image" src="/ui/bag.svg" alt="" />
          <p className="character-screen__name">모이모 굿즈</p>
          <p className="hint">준비 중이에요!</p>
        </div>
      </Tablet>
    </Layout>
  );
}
