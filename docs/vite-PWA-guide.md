# Vite 프로젝트에 PWA 도입하기 (vite-plugin-pwa)

이 가이드는 Vite 기반 프로젝트에 `vite-plugin-pwa`를 사용하여 쉽고 빠르게 PWA(Progressive Web App)를 적용하는 방법을 설명합니다. 이 방식은 `sw.js`를 직접 작성하지 않고 설정 파일만으로 관리할 수 있어 유지보수에 유리합니다.

## 1. 패키지 설치

개발 의존성으로 `vite-plugin-pwa`를 설치합니다.

```bash
npm install -D vite-plugin-pwa
```

## 2. Vite 설정 (`vite.config.js`)

`vite.config.js` 파일에 플러그인을 추가하고 설정을 정의합니다.

```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... 다른 플러그인들
    VitePWA({
      registerType: 'autoUpdate', // 업데이트 시 자동 새로고침 (또는 'prompt')
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'icon.svg'], // 캐싱할 정적 자산
      manifest: {
        name: 'My Project Name',
        short_name: 'ShortName',
        description: '프로젝트 설명',
        theme_color: '#0066cc',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/assets/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/assets/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // 캐싱할 파일 패턴
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // 외부 리소스(폰트 등) 런타임 캐싱 설정
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### 주요 설정 설명

- **registerType**: `'autoUpdate'`로 설정하면 새 콘텐츠가 있을 때 즉시 업데이트합니다. `'prompt'`로 설정하면 사용자에게 업데이트 알림을 띄울 수 있습니다.
- **manifest**: `manifest.json` 파일을 자동으로 생성합니다. 앱의 이름, 아이콘, 색상 등을 정의합니다.
- **workbox**: 서비스 워커의 캐싱 전략을 정의합니다. `globPatterns`로 미리 캐싱할 파일들을 지정할 수 있습니다.

## 3. 아이콘 및 에셋 준비

PWA가 제대로 설치되려면 다양한 크기의 아이콘이 필요합니다. `public/assets` 폴더에 아이콘들을 위치시킵니다.

### 추천 폴더 구조

```
public/
  assets/
    icon.svg          (원본, 512x512 권장)
    icon-192x192.svg
    icon-512x512.svg
    apple-touch-icon.svg
    favicon.svg
```

### 💡 팁: 아이콘 자동 생성 스크립트

매번 다양한 크기의 아이콘을 만드는 것은 번거롭습니다. `scripts/generate-icons.js`를 만들어두면 `icon.svg` 하나로 모든 아이콘을 생성할 수 있습니다.

**scripts/generate-icons.js 예시:**

```javascript
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const svgContent = readFileSync(join(process.cwd(), 'public', 'assets', 'icon.svg'), 'utf-8');

const sizes = [
  { name: 'favicon-16x16.svg', size: 16 },
  { name: 'favicon-32x32.svg', size: 32 },
  { name: 'icon-192x192.svg', size: 192 },
  { name: 'icon-512x512.svg', size: 512 },
  { name: 'apple-touch-icon.svg', size: 180 },
];

sizes.forEach(({ name, size }) => {
  // SVG 내용에서 width/height/viewBox 등을 수정하여 저장하는 로직
  // (단순 문자열 치환 방식 사용 가능)
  const resizedSvg = svgContent.replace(/width="\d+"/g, `width="${size}"`).replace(/height="\d+"/g, `height="${size}"`);
  writeFileSync(join(process.cwd(), 'public', 'assets', name), resizedSvg);
});

console.log('✅ Icons generated successfully');
```

## 4. 빌드 및 확인

설정이 완료되면 빌드를 실행합니다.

```bash
npm run build
```

빌드 후 `dist` 폴더를 확인해보면 `sw.js` 파일과 `workbox-*.js` 파일이 생성된 것을 볼 수 있습니다.

### 브라우저 확인

1. 브라우저 개발자 도구(F12) > **Application** 탭으로 이동합니다.
2. **Service Workers** 섹션에서 서비스 워커가 등록되고 활성화되었는지 확인합니다.
3. **Manifest** 섹션에서 앱 정보와 아이콘이 잘 로드되는지 확인합니다.
