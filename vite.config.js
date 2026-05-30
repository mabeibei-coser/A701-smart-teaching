import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 所有 /api/* 都转发到 Express（server.js, :4701）。
// 图片生成与全部第三方密钥已移到服务端，dev/prod 行为一致，配置里不再出现任何 key。
export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/a701/' : '/'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4701',
        changeOrigin: true,
      },
    },
  },
});
