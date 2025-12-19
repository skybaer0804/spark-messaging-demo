import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate', // 업데이트 시 자동 새로고침
      // public/ 하위의 정적 파일 경로 기준
      includeAssets: ['favicon.ico', 'asset/spark_icon.png'],
      manifest: {
        // DevTools 경고 방지 및 TWA/Bubblewrap에서 식별자 안정화
        id: '/',
        name: 'Spark Real-time Platform',
        short_name: 'Spark',
        description: 'Chat, notifications, video calls, habits, and flashcards for school',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/asset/spark_icon_16.png',
            sizes: '16x16',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/asset/spark_icon_512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshot-1.png',
            sizes: '540x720',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {
            src: '/screenshot-2.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
        ],
        categories: ['productivity', 'social', 'education'],
      },
      workbox: {
        // 캐싱할 파일 패턴
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Network First 전략 (API 요청은 네트워크 우선)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
              },
            },
          },
        ],
      },
    }),
  ],
  publicDir: 'public', // public 폴더의 파일들을 빌드 시 자동 복사
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // Sass modern API 사용 (deprecation warning 해결)
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    // 배포 환경에서 호스트 차단 방지
    allowedHosts: [
      'moral-vicki-spark-messasing-8f9488e5.koyeb.app',
      '.koyeb.app', // 모든 koyeb.app 서브도메인 허용
    ],
  },
});
