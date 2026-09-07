import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Configuration serveur de Vite uniquement, jamais injectée dans le bundle.
  const env = loadEnv(mode, process.cwd(), '');
  return {
  base: './',
  plugins: [tailwindcss()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '^/api/media$': {
        target: `http://127.0.0.1:${env.MEDIA_PORT || '8787'}`,
        headers: { Authorization: `Bearer ${env.MEDIA_ACCESS_TOKEN || ''}` },
        timeout: 660_000,
        proxyTimeout: 660_000,
      },
    },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
  };
});
