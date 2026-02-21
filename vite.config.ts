import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          manifest: false, // public/manifest.json を使用（DRY: 二重定義しない）
          workbox: {
            // Firestoreオフラインキャッシュと競合しないよう最小構成
            globPatterns: ['**/*.{js,css,html,svg,ico}'],
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        environmentMatchGlobs: [
          // Firestoreルールテストはエミュレータに接続するためNode環境が必要
          ['tests/rules/**', 'node'],
        ],
      },
    };
});
