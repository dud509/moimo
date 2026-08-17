// ============================================================
// 시안(가로 2560)을 창 너비에 맞춰 확대·축소합니다.
//
// ★ 가로 너비만 기준으로 삼습니다.
//   그래서 창 높이가 바뀌어도 물건 크기와 하늘색 띠 두께는 그대로이고,
//   가운데 크림 영역만 늘어나거나 줄어듭니다.
//   (띠가 창 위·아래 끝에 계속 붙어 있고, 여백이 생기지 않습니다)
//
//   전시장 27인치 맥(2560×1440)에서는 배율이 정확히 1 이라
//   시안 1px = 화면 1px 입니다.
// ============================================================

import { useEffect } from 'react';

export const STAGE_WIDTH = 2560;

export default function useStageScale() {
  useEffect(() => {
    function fit() {
      document.documentElement.style.setProperty(
        '--fit',
        String(window.innerWidth / STAGE_WIDTH),
      );
    }

    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
}
