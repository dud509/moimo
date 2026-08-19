import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 5173번이 이미 쓰이고 있으면 조용히 5174번으로 옮겨가지 말고 그냥 멈춥니다.
    //
    // 이게 없으면, 예전에 띄워놓고 안 끈 서버가 5173번을 붙잡고 있을 때
    // 새 서버는 5174번으로 뜨는데 우리는 계속 5173번에 들어가게 됩니다.
    // 그러면 옛날 화면이 나오거나 무한 로딩만 돕니다. 원인 찾기가 아주 어렵습니다.
    strictPort: true,
    // 같은 와이파이에 있는 다른 기기(폰 등)에서도 접속할 수 있게 해 줍니다.
    host: true,
    // 화면(5173번)에서 창고(4000번)로 요청을 넘겨주는 통로입니다.
    // 덕분에 코드에서는 주소를 신경 쓰지 않고 '/api/...' 라고만 쓰면 됩니다.
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
});
