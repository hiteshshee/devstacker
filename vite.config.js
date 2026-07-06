import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During local dev, proxy /api to the Express server on :5000 so the browser
// sees a single origin (cookies + OAuth redirects work cleanly).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
