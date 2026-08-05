// ============================================================
// 시안(2560×1440)을 통째로 화면 크기에 맞춰 확대·축소합니다.
//
// 왜 이렇게 하나요?
//   이렇게 해두면 CSS 와 화면 코드에 적는 숫자가 전부 "피그마 숫자 그대로"가
//   됩니다. 글자 크기 31, 테두리 3, 버튼 높이 80 … 이렇게요.
//   모니터가 커지든 작아지든 시안 그대로 같이 커지고 작아집니다.
//
//   전시장 27인치 맥(2560×1440)에서는 배율이 정확히 1 이라
//   시안 1px = 화면 1px 입니다.
// ============================================================

import { useEffect } from 'react';

export const STAGE = { w: 2560, h: 1440 };

export default function useStageScale() {
  useEffect(() => {
    function fit() {
      // 가로·세로 중 더 빡빡한 쪽에 맞춰야 화면 밖으로 안 삐져나갑니다.
      const scale = Math.min(window.innerWidth / STAGE.w, window.innerHeight / STAGE.h);
      document.documentElement.style.setProperty('--fit', String(scale));
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
}
