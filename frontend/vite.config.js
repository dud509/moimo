import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
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
