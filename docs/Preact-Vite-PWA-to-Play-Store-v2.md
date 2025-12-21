# Preact + Vite PWA를 Google Play Store에 배포하기

**최종 업데이트**: 2025년 1월 27일  
**작성자**: AI Assistant  
**IDE**: Cursor / VS Code  
**참고**: [Chrome TWA Quick Start Guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start?hl=ko)

---

## 📋 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [Step 1: Preact + Vite 프로젝트 PWA 세팅](#step-1-preact--vite-프로젝트-pwa-세팅)
4. [Step 2: Chrome Lighthouse로 PWA 품질 검증](#step-2-chrome-lighthouse로-pwa-품질-검증)
5. [Step 3: 개인정보처리방침 구성](#step-3-개인정보처리방침-구성)
6. [Step 4: Bubblewrap CLI 환경 구축](#step-4-bubblewrap-cli-환경-구축)
7. [Step 5: Bubblewrap 프로젝트 초기화 및 빌드](#step-5-bubblewrap-프로젝트-초기화-및-빌드)
8. [Step 6: Digital Asset Links 설정](#step-6-digital-asset-links-설정)
9. [Step 7: Google Play Developer 계정 설정](#step-7-google-play-developer-계정-설정)
10. [Step 8: 앱 스토어 등록 및 배포](#step-8-앱-스토어-등록-및-배포)
11. [체크리스트](#체크리스트)
12. [트러블슈팅](#트러블슈팅)

---

## 개요

이 가이드는 다음 흐름을 따릅니다:

```
Preact + Vite 웹앱 (로컬)
        ↓
    PWA 세팅 (Manifest, Service Worker, HTTPS 배포)
        ↓
    Lighthouse 검증 (PWA 점수 90점 이상)
        ↓
    Bubblewrap CLI (Android 프로젝트 생성)
        ↓
    Digital Asset Links (신뢰 관계 설정)
        ↓
    AAB/APK 빌드
        ↓
    Google Play Store 업로드
        ↓
    심사 → 배포
```

---

## 사전 요구사항

### 2.1 컴퓨터 환경

| 항목        | 버전             | 설명                                                |
| ----------- | ---------------- | --------------------------------------------------- |
| **Node.js** | 14.0 이상        | npm 패키지 관리자 포함                              |
| **JDK**     | 11 이상          | Android 빌드 시스템 (Bubblewrap이 자동 설치 지원)   |
| **Python**  | 3.6 이상         | Gradle 빌드 의존성 (선택사항, Bubblewrap 자동 설정) |
| **Git**     | 최신             | 버전 관리 (권장)                                    |
| **IDE**     | Cursor / VS Code | 코드 편집 (권장: Cursor 최신 버전)                  |

### 2.2 개발 기기 (테스트용)

- **Android 휴대폰** 또는 **에뮬레이터** (API Level 19 이상)
- **USB 디버깅 활성화** (연결된 기기에서)
- **Chrome 브라우저** 72 이상 설치 (TWA 지원)

### 2.3 계정

- **Google 계정** (Play Console 등록)
- **Google Play Developer 계정** ($25 일회 등록료)
- **도메인 소유권** (또는 호스팅 서비스 접근 권한)

### 2.4 설치 확인 명령어

```bash
# Node.js 확인
node --version
npm --version

# JDK 확인 (Bubblewrap이 자동 설정할 수 있음)
java -version

# 만약 직접 JDK 설치 필요 시
# Mac: brew install openjdk@11
# Windows: Chocolatey 또는 공식 사이트에서 다운로드
# Linux: apt-get install openjdk-11-jdk
```

---

## Step 1: Preact + Vite 프로젝트 PWA 세팅

### 1.1 Preact + Vite 프로젝트 생성 (신규 프로젝트)

```bash
# Preact + Vite 템플릿으로 프로젝트 생성
npm create vite@latest my-pwa-app -- --template preact

# 프로젝트 디렉토리 진입
cd my-pwa-app

# 의존성 설치
npm install
```

### 1.2 vite-plugin-pwa 설치

```bash
npm install -D vite-plugin-pwa
npm install workbox-cli workbox-window
```

### 1.3 vite.config.ts 수정

**파일**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      // 기본 PWA 설정
      registerType: 'autoUpdate', // 백그라운드에서 자동 업데이트

      // Manifest 설정
      manifest: {
        name: '앱의 전체 이름', // ex. '플레이 하비트 트래커'
        short_name: '앱 단축명', // ex. '습관'
        description: '앱 설명',
        theme_color: '#2196F3', // 테마 색상
        background_color: '#ffffff', // 배경 색상
        display: 'standalone', // 전체화면, 상단 주소창 X
        start_url: '/', // 시작 URL
        scope: '/', // 앱 범위
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
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
        categories: ['productivity', 'lifestyle'], // Google Play 카테고리에 맞춰서 선택
      },

      // Service Worker 설정
      workbox: {
        // 런타임 캐싱 전략
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
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5분
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: false, // false로 설정해야 안정적인 업데이트
      },

      // 앱 별 설정
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],

      // Devtools에서 PWA 상태 확인 가능
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: false,
        type: 'module',
      },
    }),
  ],

  build: {
    sourcemap: false, // 프로덕션에서는 false
    chunkSizeWarningLimit: 500,
  },
});
```

### 1.4 Public 폴더에 아이콘 & 메타 파일 준비

`public/` 폴더 구조:

```
public/
├── icon-192x192.png
├── icon-512x512.png
├── icon-maskable-192x192.png
├── icon-maskable-512x512.png
├── apple-touch-icon.png (180x180)
├── favicon.ico
└── robots.txt
```

**파일**: `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://your-domain.com/sitemap.xml
```

### 1.5 index.html에 메타 태그 추가

**파일**: `index.html`

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- PWA 메타 태그 -->
    <meta name="theme-color" content="#2196F3" />
    <meta name="description" content="앱 설명" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="앱 단축명" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <!-- Manifest 링크 (vite-plugin-pwa가 자동 생성) -->
    <link rel="manifest" href="/manifest.webmanifest" />

    <title>앱 이름</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 1.6 프로젝트 빌드 및 로컬 테스트

```bash
# 빌드
npm run build

# 빌드 결과 확인 (dist/manifest.webmanifest 생성됨)
ls -la dist/

# 로컬 HTTPS 서버로 테스트 (http-server 권장)
# 먼저 설치
npm install -g http-server

# HTTPS로 실행 (자체 서명 인증서)
# Mac/Linux
http-server dist -p 8080 -c-1 --cors

# 또는 Python으로 간단 테스트 (HTTP만)
python3 -m http.server 8080 --directory dist
```

---

## Step 2: Chrome Lighthouse로 PWA 품질 검증

### 2.1 Lighthouse란?

Chrome DevTools에 내장된 자동 감사 도구로, PWA, 성능, 접근성, SEO 등을 검사합니다.

**PWA 검증 항목**:

- ✅ Manifest 유효성
- ✅ Service Worker 등록 및 동작
- ✅ HTTPS 사용 여부
- ✅ 설치 가능성
- ✅ 스플래시 스크린 (아이콘, 색상)
- ✅ 오프라인 지원

### 2.2 Lighthouse 실행 방법

#### 방법 1: Chrome DevTools (권장)

1. **배포된 URL에서 Chrome 열기**

   ```
   https://your-domain.com
   ```

2. **DevTools 열기**

   ```
   Windows/Linux: F12
   Mac: Cmd + Option + I
   ```

3. **Lighthouse 탭 클릭**

4. **"분석 페이지 로드" 클릭** (또는 "PWA만 검사")

5. **결과 확인**

#### 방법 2: CLI (자동화)

```bash
# npm으로 설치
npm install -g lighthouse

# PWA 검사
lighthouse https://your-domain.com --view --output-path=./report.html
```

### 2.3 PWA 점수 달성 기준

| 항목           | 목표 점수 | 설명                       |
| -------------- | --------- | -------------------------- |
| **PWA 최적화** | 90점 이상 | Bubblewrap 진행 필수 조건  |
| **성능**       | 75점 이상 | 로딩 속도 최적화           |
| **접근성**     | 80점 이상 | 색상 대비, ARIA 레이블     |
| **SEO**        | 80점 이상 | 메타 설명, 구조화된 데이터 |
| **안정성**     | 80점 이상 | HTTPS, 404 처리            |

### 2.4 자주하는 실수 & 해결책

| 문제                          | 해결책                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------ |
| ❌ "설치 불가능"              | manifest.json이 제대로 로드되는지 확인. DevTools → Application → Manifest 확인 |
| ❌ "Service Worker 등록 안됨" | HTTPS 필수. 로컬에선 `localhost`도 동작. 배포 URL에서 테스트                   |
| ❌ "아이콘 누락"              | 192x192, 512x512 PNG 파일 필요. `public/` 폴더에 배치                          |
| ❌ "배경색/테마색 미설정"     | manifest.json의 `theme_color`, `background_color` 확인                         |
| ❌ "스플래시 스크린 없음"     | 아이콘 + 테마색 + 배경색이 모두 필요                                           |

### 2.5 성능 점수 개선 팁

```bash
# 1. 빌드 최적화
npm run build
# → dist 폴더 파일 크기 확인

# 2. 번들 분석 (Bundle Analysis)

# 옵션 A: rollup-plugin-visualizer (가장 추천: 표준 패턴)
# Vite는 프로덕션 빌드 시 Rollup을 사용하므로 가장 정확하고 흔하게 쓰입니다.
npm install -D rollup-plugin-visualizer

# vite.config.ts 수정
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... 다른 플러그인들
    visualizer({
      filename: './dist/stats.html', // 분석 리포트 저장 위치
      open: true,      // 빌드 완료 후 자동으로 브라우저 열기
      gzipSize: true,  // gzip 압축 후 크기 표시 (실제 로딩 성능 예측)
      brotliSize: true // brotli 압축 크기 표시
    }),
  ],
})

# 옵션 B: vite-bundle-analyzer (대안)
# Vite 환경에 특화된 분석 도구를 원한다면 이 패키지도 선택지로 고려할 수 있습니다.
# npm install -D vite-bundle-analyzer

# 3. 이미지 최적화
# - WebP 형식 사용
# - 해상도 줄이기
# - 압축 도구 사용 (TinyPNG, ImageOptim 등)

# 4. 캐싱 전략 검토 (vite.config.ts의 workbox 설정)
```

---

## Step 3: 개인정보처리방침 구성

### 3.1 왜 필요한가?

Google Play Store 앱 등록 시 **필수 항목**입니다. 개인 정보 수집·이용·보관에 대한 명시가 없으면 심사 불합격입니다.

### 3.2 개인정보처리방침 작성 방법

#### 옵션 1: 온라인 생성 도구

- [Termly Privacy Policy Generator](https://termly.io/products/privacy-policy-generator/)
- [Privacy Policy Generator](https://www.privacy-policy-generator.com/)
- [Iubenda](https://www.iubenda.com/)

#### 옵션 2: 직접 작성 (기본 템플릿)

```markdown
# 개인정보처리방침

**버전**: 1.0  
**최종 업데이트**: 2025-12-19

## 1. 개인정보 수집 범위

본 앱 ("앱명")은 다음과 같은 개인정보를 수집할 수 있습니다:

- 사용자 이름
- 이메일 주소
- 기기 ID
- 위치 정보 (권한 허용 시)
- 사용 통계 (Google Analytics 등)

## 2. 수집 목적

- 서비스 제공 및 개선
- 사용자 지원 (이메일 응답)
- 분석 및 성능 모니터링

## 3. 개인정보 보관

- 서비스 제공 기간 동안 보관
- 사용자 요청 시 즉시 삭제
- 법적 의무가 있는 경우 유지

## 4. 제3자 공유

다음 서비스와 정보 공유:

- Google Analytics (분석)
- Firebase (인증, 데이터베이스)
- [기타 사용하는 서비스]

## 5. 사용자 권리

사용자는 언제든지 다음을 요청할 수 있습니다:

- 개인정보 열람
- 수정 또는 삭제
- 수집 거부

**문의**: support@your-domain.com

## 6. 정책 변경

정책 변경 시 앱 내 공지합니다.
```

### 3.3 웹사이트에 게시

```bash
# 1. 프로젝트 내 경로 생성
mkdir -p public/legal
echo "# 개인정보처리방침" > public/legal/privacy-policy.md

# 2. 웹사이트에서 접근 가능하도록 설정
# URL: https://your-domain.com/legal/privacy-policy
# 또는 동적 라우팅으로 처리 (Preact Router 사용)

# 3. 빌드 후 배포
npm run build
```

### 3.4 Google Play Console에서 링크 설정

나중에 Step 7에서 다음을 입력합니다:

```
개인정보처리방침 URL: https://your-domain.com/legal/privacy-policy
```

---

## Step 4: Bubblewrap CLI 환경 구축

### 4.1 Bubblewrap이란?

Google Chrome Labs에서 제공하는 CLI 도구로, PWA를 Android 앱(TWA)으로 변환합니다.

- **자동화**: Manifest 읽어 앱 설정 자동 채우기
- **빌드**: AAB/APK 생성
- **서명**: 앱 서명키 관리
- **검증**: Digital Asset Links 검증

### 4.2 Bubblewrap 설치

```bash
# 전역 설치 (권장)
npm install -g @bubblewrap/cli

# 설치 확인
bubblewrap --version
# 출력: @bubblewrap/cli/1.11.0 (또는 최신 버전)
```

### 4.3 JDK & Android SDK 자동 설정

Bubblewrap을 처음 실행할 때 필요한 도구를 자동으로 설정할 수 있습니다.

```bash
# 새로운 디렉토리에서 환경 설정 수행
cd ~/my-pwa-project

# Bubblewrap 환경 설정 실행
bubblewrap doctor

# 출력 예시:
# ✓ Android SDK found at: /Users/username/Library/Android/sdk
# ✓ JDK found at: /usr/libexec/java_home -v 11
# ✓ Java version: openjdk version "11.0.15" 2022-04-19
```

#### 만약 doctor 검사에서 오류가 나면?

```bash
# 1. JDK 다시 설치
# Mac
brew install openjdk@11
echo 'export PATH="/usr/local/opt/openjdk@11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 2. JAVA_HOME 환경변수 설정
export JAVA_HOME=$(/usr/libexec/java_home -v 11)

# 3. Android SDK 수동 설치
# Option A: Android Studio 설치 (GUI 포함)
# https://developer.android.com/studio

# Option B: Command Line Tools만 설치
# https://developer.android.com/studio#command-line-tools
# 다운로드 후:
mkdir -p ~/Library/Android/sdk
unzip cmdline-tools-xxx.zip -d ~/Library/Android/sdk/cmdline-tools

# 4. Android SDK 설치
~/Library/Android/sdk/cmdline-tools/bin/sdkmanager --sdk_root=~/Library/Android/sdk "platforms;android-34"
~/Library/Android/sdk/cmdline-tools/bin/sdkmanager --sdk_root=~/Library/Android/sdk "build-tools;34.0.0"

# 5. 환경변수 설정
export ANDROID_SDK_ROOT=~/Library/Android/sdk
```

### 4.4 Cursor / VS Code 터미널 설정

#### Cursor에서 Bubblewrap 실행

1. **새 터미널 열기**

   ```
   Ctrl + ` (백틱) 또는 View → Terminal
   ```

2. **현재 프로젝트 디렉토리에서 실행**
   ```bash
   pwd  # 현재 경로 확인
   bubblewrap doctor  # 환경 검사
   ```

#### VS Code에서 Bubblewrap 실행

1. **Integrated Terminal 열기**

   ```
   Ctrl + ` 또는 Terminal → New Terminal
   ```

2. **터미널 기본값 설정 (선택사항)**

   ```
   Settings → Terminal → Default Profile → bash/zsh 선택
   ```

3. **명령어 실행**

### 4.5 Bubblewrap 버전 확인 및 업데이트

```bash
# 현재 버전 확인
bubblewrap --version

# 최신 버전으로 업데이트
npm install -g @bubblewrap/cli@latest

# 특정 버전 설치 (필요 시)
npm install -g @bubblewrap/cli@1.11.0
```

---

## Step 5: Bubblewrap 프로젝트 초기화 및 빌드

### 5.1 Bubblewrap 프로젝트 디렉토리 준비

```bash
# Preact + Vite 프로젝트와 별도로 Bubblewrap 프로젝트 생성
mkdir my-pwa-android
cd my-pwa-android

# 이 디렉토리에서 Bubblewrap 명령어 실행
```

### 5.2 PWA Init: Manifest 기반 프로젝트 생성

```bash
# 배포된 PWA의 manifest.webmanifest URL을 사용해 Android 프로젝트 초기화
# ⚠️ 주의: 도메인 루트(예: https://your-domain.com)는 HTML(index.html)이므로 실패합니다.
# 반드시 manifest 파일 경로까지 포함하세요.
bubblewrap init --manifest=https://spark.koyeb.app/manifest.webmanifest

# 또는 로컬 manifest.json 사용 (개발 중)
bubblewrap init --manifest=http://localhost:8080/manifest.webmanifest
```

### 5.3 Init 과정에서 입력해야 할 항목

터미널에 나타나는 질문들은 5단계로 구성됩니다:

#### Web app details (1/5)

PWA가 호스팅되는 도메인과 시작 경로를 입력합니다.

```
? Domain: spark.koyeb.app
? URL path: /
```

**설명**:

- **Domain**: PWA가 호스팅되는 도메인 (예: `example.com`, `spark.koyeb.app`)
- **URL path**: 앱이 시작될 때 열리는 경로 (예: `/`, `/path-to-pwa/`)

#### Android app details (2/5)

Android 앱의 기본 정보를 입력합니다.

```
? Application name: Spark Real-time Platform
? Short name: Spark
? Application ID: app.koyeb.spark.twa
? Starting version code for the new app version: 1
? Display mode: standalone
? Orientation: portrait-primary
? Status bar color: #1A1A2E
```

**설명**:

- **Application name**: Google Play Store와 앱 정보 화면에 표시되는 전체 이름
- **Short name**: 런처 화면에 표시되는 짧은 이름 (최대 12자)
- **Application ID**: 패키지 이름, 고유 식별자 (예: `com.company.appname`, `app.koyeb.spark.twa`)
- **Starting version code**: 앱 버전 코드 (1부터 시작, 업데이트 시 증가)
- **Display mode**: 앱 표시 모드 (`standalone` | `fullscreen` | `browser` | `minimal-ui`)
- **Orientation**: 화면 방향 (`portrait-primary` | `portrait-secondary` | `landscape-primary` | `landscape-secondary` | `any`)
- **Status bar color**: 상태 표시줄 색상 (Hex 형식, 예: `#1A1A2E`)

#### Launcher icons and splash screen (3/5)

앱 아이콘과 스플래시 스크린 설정을 입력합니다.

```
? Splash screen color: #0F0F1E
? Icon URL: https://spark.koyeb.app/asset/spark_icon_512.png
? Maskable icon URL: https://spark.koyeb.app/asset/spark_icon_512_maskable.png
```

**설명**:

- **Splash screen color**: 스플래시 스크린 배경색 (Hex 형식, 예: `#0F0F1E`)
- **Icon URL**: 최소 512x512px 아이콘 이미지 URL (런처 아이콘 및 스플래시 스크린 생성에 사용)
- **Maskable icon URL**: (선택사항) 최소 512x512px 마스커블 아이콘 URL (적응형 런처 아이콘용)

#### Optional Features (4/5)

선택적 기능들을 설정합니다.

```
? Monochrome icon URL:
? Include support for Play Billing? No
? Request geolocation permission? No
```

**설명**:

- **Monochrome icon URL**: (선택사항) 최소 48x48px 단색 아이콘 URL (알림 아이콘용, PWA의 `theme_color`로 표시됨)
- **Include support for Play Billing?**: Google Play 결제 지원 여부 (`Yes` | `No`)
- **Request geolocation permission?**: 위치 정보 권한 요청 여부 (`Yes` | `No`)

#### Signing key information (5/5)

앱 서명에 사용할 키스토어 정보를 입력합니다.

```
? Key store location: C:\project\spark-messaging-bublewrap\android.keystore
? Key name: android
```

**설명**:

- **Key store location**: 키스토어 파일 경로 (기존 파일이 없으면 생성 프롬프트 표시)
- **Key name**: 키스토어 내 키 별칭 (alias)

**키스토어가 없을 경우 추가 질문**:

```
? Do you want to create one now? Yes
? First and Last names (eg: John Doe): Wonjae No
? Organizational Unit (eg: Engineering Dept): Enginerring Dept
? Organization (eg: Company Name): Noden
? Country (2 letter code): KR
? Password for the Key Store: *********
? Password for the Key: *********
```

**설명**:

- **Do you want to create one now?**: 새 키스토어 생성 여부 (`Yes` | `No`)
- **First and Last names**: 이름 (예: `John Doe`)
- **Organizational Unit**: 조직 단위 (예: `Engineering Dept`)
- **Organization**: 조직명 (예: `Company Name`)
- **Country**: 국가 코드 (2자리, 예: `KR`, `US`)
- **Password for the Key Store**: 키스토어 비밀번호 (안전하게 보관)
- **Password for the Key**: 키 비밀번호 (키스토어 비밀번호와 동일하거나 다를 수 있음)

**완료 메시지**:

```
keytool Signing Key created successfully
Project generated successfully. Build it by running bubblewrap build
```

### 5.4 생성된 프로젝트 구조

Bubblewrap init이 완료되면 다음과 같은 구조로 Android Gradle 프로젝트가 생성됩니다:

```bash
spark-messaging-bublewrap/  (또는 지정한 프로젝트 이름)
├── .gradle/                 (Gradle 캐시)
├── app/                     (Android 앱 모듈)
│   └── ...
├── build/                   (빌드 출력)
├── gradle/                  (Gradle 래퍼)
├── android.keystore         (앱 서명키 - 보안 유지 필수!)
├── build.gradle             (프로젝트 빌드 설정)
├── gradle.properties        (Gradle 속성)
├── gradlew                  (Gradle 래퍼 스크립트 - Unix/Mac)
├── gradlew.bat              (Gradle 래퍼 스크립트 - Windows)
├── manifest-checksum.txt    (매니페스트 체크섬)
├── settings.gradle          (프로젝트 설정)
├── store_icon.png           (스토어 아이콘)
└── twa-manifest.json        (TWA 메타데이터 설정 파일)
```

**주요 파일 설명**:

- `android.keystore`: 앱 서명에 사용되는 키스토어 파일 (절대 공유하거나 잃어버리지 마세요!)
- `twa-manifest.json`: TWA 앱의 모든 설정이 담긴 메인 설정 파일
- `app/`: 실제 Android 앱 코드가 들어있는 모듈 디렉토리
- `build.gradle`, `settings.gradle`: Gradle 빌드 시스템 설정 파일

### 5.5 프로젝트 설정 파일 검토 & 수정

**파일**: `twa-manifest.json`

이 파일은 TWA 앱의 모든 설정을 담고 있는 메인 설정 파일입니다. init 과정에서 입력한 값들이 자동으로 반영됩니다.

```json
{
  "packageId": "app.koyeb.spark.twa",
  "host": "spark.koyeb.app",
  "name": "Spark Real-time Platform",
  "launcherName": "Spark",
  "display": "standalone",
  "themeColor": "#1A1A2E",
  "themeColorDark": "#000000",
  "navigationColor": "#000000",
  "navigationColorDark": "#000000",
  "navigationDividerColor": "#000000",
  "navigationDividerColorDark": "#000000",
  "backgroundColor": "#0F0F1E",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://spark.koyeb.app/asset/spark_icon_512.png",
  "maskableIconUrl": "https://spark.koyeb.app/asset/spark_icon_512_maskable.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "C:\\project\\spark-messaging-bublewrap\\android.keystore",
    "alias": "android"
  },
  "appVersionName": "1",
  "appVersionCode": 1,
  "shortcuts": [],
  "generatorApp": "bubblewrap-cli",
  "webManifestUrl": "https://spark.koyeb.app/manifest.webmanifest",
  "fallbackType": "customtabs",
  "features": {},
  "alphaDependencies": {
    "enabled": false
  },
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "isMetaQuest": false,
  "fullScopeUrl": "https://spark.koyeb.app/",
  "minSdkVersion": 21,
  "orientation": "portrait-primary",
  "fingerprints": [],
  "additionalTrustedOrigins": [],
  "retainedBundles": [],
  "protocolHandlers": [],
  "fileHandlers": [],
  "launchHandlerClientMode": "",
  "displayOverride": [],
  "appVersion": "1"
}
```

**주요 필드 설명**:

- `packageId`: Android 앱의 고유 패키지 이름
- `host`: PWA가 호스팅되는 도메인
- `name`: 앱의 전체 이름
- `launcherName`: 런처에 표시되는 짧은 이름
- `display`: 앱 표시 모드 (`standalone`, `fullscreen`, `browser`, `minimal-ui`)
- `themeColor`, `backgroundColor`: 테마 색상 및 배경색
- `iconUrl`, `maskableIconUrl`: 앱 아이콘 URL
- `signingKey`: 서명키 경로 및 별칭
- `appVersionCode`: 앱 버전 코드 (업데이트 시 증가)
- `minSdkVersion`: 최소 지원 Android SDK 버전
- `orientation`: 화면 방향 설정

**설정 수정 후 반영**:

```bash
# twa-manifest.json 수정 후 Android 프로젝트에 반영
bubblewrap update

# 또는 빌드 시 자동 반영됨
bubblewrap build
```

### 5.5.5 Keystore 관리 및 팀 개발 가이드

**⚠️ 중요**: Keystore 파일은 **절대 Git 저장소에 커밋하면 안 됩니다!** 이 파일은 앱 서명에 사용되는 민감한 보안 파일입니다.

#### Git에서 Keystore 제외하기

프로젝트 루트의 `.gitignore` 파일에 다음을 추가하세요:

```gitignore
# Android Keystore files
*.keystore
*.jks
android.keystore
```

#### 팀 개발 시 Keystore 관리 방법

여러 개발자와 함께 프로젝트를 개발할 때는 다음 방법 중 하나를 선택하세요:

##### 옵션 A: 각자 개발용 Keystore 사용 (권장)

**장점**:

- 각 개발자가 독립적으로 개발 및 테스트 가능
- 보안 위험 최소화
- 프로덕션 keystore와 분리되어 안전

**방법**:

1. 각 개발자가 `bubblewrap init` 실행 시 자신의 keystore 생성
2. `twa-manifest.json`의 `signingKey.path`를 상대 경로로 설정:
   ```json
   {
     "signingKey": {
       "path": "./android.keystore", // 절대 경로 대신 상대 경로 사용
       "alias": "android"
     }
   }
   ```
3. 프로덕션 빌드는 CI/CD 또는 배포 담당자만 수행

##### 옵션 B: 공유 Keystore 사용 (프로덕션용)

**사용 시기**: Play Store에 실제 배포할 앱을 빌드할 때

**⚠️ 주의사항**:

- Keystore 파일과 비밀번호는 **절대 Git에 커밋하지 마세요**
- Keystore를 잃어버리면 같은 패키지명으로 업데이트할 수 없습니다
- 비밀번호를 잊으면 복구할 수 없습니다

**안전한 공유 방법**:

1. **암호화된 저장소 사용**

   - 1Password, Bitwarden 등 비밀번호 관리자
   - 회사 내부 보안 저장소
   - 암호화된 ZIP 파일 (비밀번호는 별도 채널로 전달)

2. **CI/CD에서만 사용**

   - GitHub Secrets, GitLab CI Variables 등에 keystore 저장
   - 로컬 개발자는 각자 keystore 사용
   - 프로덕션 빌드는 CI/CD 파이프라인에서만 수행

3. **물리적 전달**
   - 암호화된 USB 드라이브
   - 신뢰할 수 있는 채널을 통한 직접 전달

**공유 시 포함할 정보**:

- Keystore 파일 (`android.keystore`)
- Keystore 비밀번호
- Key 별칭 (alias, 기본값: `android`)
- Key 비밀번호 (keystore 비밀번호와 다를 수 있음)

##### 옵션 C: CI/CD 전용 Keystore

**구조**:

- 로컬 개발: 각 개발자가 자신의 keystore 사용
- 프로덕션 빌드: CI/CD에서만 공유 keystore 사용

**장점**:

- 프로덕션 keystore가 로컬에 노출되지 않음
- 자동화된 배포 프로세스 구축 가능

#### Keystore 백업 및 보관

**프로덕션 Keystore는 반드시 안전한 곳에 백업하세요:**

1. **백업 위치**

   - 암호화된 클라우드 저장소 (예: Google Drive 암호화 폴더)
   - 회사 보안 저장소
   - 오프라인 백업 (암호화된 USB)

2. **백업 시 포함할 정보**

   - Keystore 파일
   - Keystore 비밀번호
   - Key 별칭 및 비밀번호
   - 생성 날짜 및 용도

3. **문서화**
   - 팀 내부 문서에 keystore 위치 및 접근 방법 기록
   - 비밀번호는 별도 보안 저장소에만 보관

#### 프로젝트 설정 권장사항

**`twa-manifest.json` 설정**:

```json
{
  "signingKey": {
    "path": "./android.keystore", // 상대 경로 사용 (팀 개발에 유리)
    "alias": "android"
  }
}
```

**이유**:

- 절대 경로는 각 개발자의 환경에 따라 다를 수 있음
- 상대 경로는 프로젝트 루트 기준으로 동작하여 일관성 유지

#### assetlinks.json과의 연관성

**중요**: Keystore를 변경하면 `assetlinks.json`의 SHA256 핑거프린트도 함께 업데이트해야 합니다.

- 개발용 keystore 사용 시: 개발용 keystore의 SHA256 핑거프린트를 `assetlinks.json`에 추가
- 프로덕션 keystore 사용 시: 프로덕션 keystore의 SHA256 핑거프린트를 `assetlinks.json`에 추가
- 여러 keystore 지원: `sha256_cert_fingerprints` 배열에 여러 핑거프린트를 추가하면 모두 인증됨

자세한 내용은 [6.3 assetlinks.json 파일 생성](#63-assetlinksjson-파일-생성) 섹션의 "SHA256 핑거프린트와 Git 관리" 부분을 참고하세요.

#### 문제 해결

**Keystore를 잃어버린 경우**:

- 같은 패키지명으로 업데이트 불가능
- Play Store에 새 앱으로 등록해야 함
- `assetlinks.json`의 SHA256 핑거프린트도 새 keystore로 업데이트 필요
- **해결책**: 항상 백업을 유지하세요!

**비밀번호를 잊은 경우**:

- 복구 불가능
- 새 keystore 생성 필요
- `assetlinks.json`의 SHA256 핑거프린트도 새 keystore로 업데이트 필요
- **해결책**: 비밀번호를 안전한 곳에 기록하세요!

### 5.6 Android 프로젝트 빌드

```bash
# 1. AAB (Android App Bundle) 빌드 (권장, Play Store 업로드용)
bubblewrap build

# 2. 또는 APK 빌드 (기기 테스트용)
bubblewrap build --includeAab=false
```

#### 빌드 프로세스 (시간: 3~5분)

```
✓ Checking PWA installability...
✓ Downloading web content...
✓ Copying assets...
✓ Generating Android project...
✓ Building Gradle project...
✓ Signing APK...
✓ Creating AAB...
✓ Done!

Output:
├── app/build/outputs/apk/release/app-release.apk
├── app/build/outputs/bundle/release/app-release.aab
└── app/build/intermediates/signing_config/release/out
```

### 5.7 빌드 결과물 확인

```bash
# 생성된 파일 확인
ls -lh app/build/outputs/

# AAB 파일
# -rw-r--r--  1 user  staff  12M 12-19 15:00 app-release.aab

# APK 파일 (있는 경우)
# -rw-r--r--  1 user  staff  15M 12-19 15:00 app-release.apk
```

### 5.8 로컬 기기에서 테스트 (선택사항)

```bash
# 안드로이드 기기를 USB로 연결하고 USB 디버깅 활성화 후:

# 1. 기기 연결 확인
adb devices
# List of attached devices:
# emulator-5554 device

# 2. 앱 설치
bubblewrap install

# 또는 수동 설치
adb install app/build/outputs/apk/release/app-release.apk

# 3. 기기에서 앱 실행 및 테스트
# (이 단계에서 Digital Asset Links 미설정 시 맞춤탭으로 표시됨)
```

---

## Step 6: Digital Asset Links 설정

### 6.1 Digital Asset Links란?

앱과 웹사이트의 "신뢰 관계"를 증명하는 파일입니다. 이 파일이 없으면 앱이 맞춤탭 모드로 실행됩니다 (주소창 표시).

### 6.2 SHA256 핑거프린트 얻기

```bash
# Bubblewrap이 생성한 서명키에서 SHA256 추출
# 주의: 키스토어 파일명은 bubblewrap init 시 설정한 경로를 사용합니다
# 기본값: android.keystore (twa-manifest.json의 signingKey.path 확인)
keytool -list -v -keystore ./android.keystore -alias android

# 프롬프트에서 비밀번호 입력 (init 때 설정한 키스토어 비밀번호)
# 출력:
# ...
# SHA1: AB:CD:EF:12:34:56:...
# SHA-256: ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
# ...

# SHA-256 값 복사하기 (콜론 제거 필요)
# 예: ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890
```

**참고**:

- 키스토어 파일 경로는 `twa-manifest.json`의 `signingKey.path`에서 확인할 수 있습니다.
- 키 별칭(alias)은 `signingKey.alias`에서 확인할 수 있습니다 (기본값: `android`).

### 6.3 assetlinks.json 파일 생성

**중요**: 이 파일은 **실제 PWA 프로젝트**의 `public` 디렉토리에 생성해야 합니다. (Bubble로 복사한 프로젝트가 아닌 원본 PWA 프로젝트)

**파일 경로**: `public/.well-known/assetlinks.json`

먼저 디렉토리 생성:

```bash
mkdir -p public/.well-known
```

**파일 내용**:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.appname",
      "sha256_cert_fingerprints": ["ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890"]
    }
  }
]
```

- namespace: "android_app" - 잘못되면 Android가 링크를 인식하지 못합니다.
- package_name: "app.koyeb.spark.twa" - 실제 앱 패키지와 일치해야 합니다.
- sha256_cert_fingerprints: ["AB..."] - 실제 SHA256 지문. 즉, 키스토어의 실제 지문과 일치해야 합니다.

#### ⚠️ SHA256 핑거프린트와 Git 관리

**SHA256 핑거프린트는 공개 정보입니다:**

- Digital Asset Links 검증을 위해 웹사이트의 `.well-known/assetlinks.json` 파일이 공개적으로 접근 가능해야 합니다.
- 따라서 이 파일은 Git에 커밋되어 웹사이트에 배포되어야 합니다.
- SHA256 핑거프린트는 keystore의 공개키에서 추출한 것이므로, 이것만으로는 keystore를 복구하거나 악용할 수 없습니다.

**하지만 개발 단계에서는 주의가 필요합니다:**

1. **개발용 vs 프로덕션용 분리**

   - 개발 단계: 각 개발자의 개발용 keystore 핑거프린트 사용
   - 프로덕션 배포: 프로덕션 keystore 핑거프린트만 사용

2. **Git 관리 전략**

   **옵션 A: 개발용 핑거프린트만 Git에 포함 (권장)**

   ```json
   // 개발 단계: 개발용 keystore의 핑거프린트
   "sha256_cert_fingerprints": ["개발용_핑거프린트"]
   ```

   - 로컬 개발 및 테스트에 사용
   - Git에 커밋해도 안전

   **옵션 B: 프로덕션 핑거프린트는 배포 시에만 추가**

   ```json
   // 프로덕션 배포 시: 프로덕션 keystore의 핑거프린트 추가
   "sha256_cert_fingerprints": [
     "개발용_핑거프린트",
     "프로덕션_핑거프린트"  // 배포 시에만 추가
   ]
   ```

   - CI/CD 파이프라인에서 프로덕션 빌드 시 자동으로 추가
   - 또는 배포 전에 수동으로 추가

3. **보안 고려사항**

   - SHA256 핑거프린트 자체는 공개 정보이지만, 프로덕션 keystore의 핑거프린트가 노출되면:
     - 앱과 웹사이트의 연결 관계가 노출됨
     - 패키지명과 도메인 연결 정보가 노출됨
   - 개발 단계에서는 개발용 keystore의 핑거프린트를 사용하는 것을 권장합니다.

4. **환경별 관리 예시**

   **개발 환경** (`public/.well-known/assetlinks.json`):

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "app.koyeb.spark.twa",
         "sha256_cert_fingerprints": ["개발용_keystore의_SHA256_핑거프린트"]
       }
     }
   ]
   ```

   **프로덕션 배포 시** (CI/CD 또는 배포 전 수동 수정):

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "app.koyeb.spark.twa",
         "sha256_cert_fingerprints": ["개발용_keystore의_SHA256_핑거프린트", "프로덕션_keystore의_SHA256_핑거프린트"]
       }
     }
   ]
   ```

   **참고**: 여러 핑거프린트를 배열로 나열하면, 해당 keystore 중 하나로 서명된 앱이 모두 인증됩니다.

### 6.4 assetlinks.json 배포

```bash
# 1. 빌드 (assetlinks.json이 배포됨)
npm run build

# 2. HTTPS로 배포된 서버에 업로드
# 결과: https://your-domain.com/.well-known/assetlinks.json

# 3. 접근 가능 확인
curl https://your-domain.com/.well-known/assetlinks.json
# 정상: JSON 내용 출력
```

### 6.5 검증

**1단계: 배포된 서버에서 assetlinks.json 접근 확인**

배포된 서버의 실제 도메인으로 확인 (예: `https://your-domain.com`):

**브라우저에서:**

```
https://your-domain.com/.well-known/assetlinks.json
```

**터미널에서 확인 (Linux/Mac/Git Bash):**

```bash
curl https://your-domain.com/.well-known/assetlinks.json
# 정상: JSON 내용 출력
```

**PowerShell에서 확인:**

```powershell
# 방법 1: curl.exe 사용
curl.exe https://your-domain.com/.well-known/assetlinks.json

# 방법 2: Invoke-WebRequest 사용
Invoke-WebRequest -Uri "https://your-domain.com/.well-known/assetlinks.json" | Select-Object -ExpandProperty Content
```

**2단계: Google Digital Asset Links 검증**

브라우저에서 직접 확인 (가장 간단):

```
https://digitalassetlinks.googleapis.com/v1/statements/list?source.web.site=https://your-domain.com&relation=delegate_permission/common.handle_all_urls
```

또는 Google의 온라인 검증 도구 사용:

```
https://developers.google.com/digital-asset-links/tools/generator
```

**참고**: Google API는 POST 요청을 사용하므로, 브라우저나 온라인 도구를 사용하는 것이 더 편리합니다.

### 6.6 문제 해결

| 증상                     | 원인                                     | 해결책                                           |
| ------------------------ | ---------------------------------------- | ------------------------------------------------ |
| "linked": false          | assetlinks.json 접근 불가 또는 형식 오류 | HTTPS 확인, JSON 유효성 검사                     |
| 404 오류                 | 파일 경로 오류                           | `.well-known/assetlinks.json` 정확한 경로 확인   |
| 앱 실행 시 여전히 맞춤탭 | 서명키 SHA256 불일치                     | `keytool` 재확인, Play Store 배포 후 다시 테스트 |

---

## Step 7: Google Play Developer 계정 설정

### 7.1 Google Play Console 계정 생성

#### 7.1.1 Google 계정 준비

Google 계정이 없으면 먼저 생성합니다:

```
https://accounts.google.com/signup
```

#### 7.1.2 Google Play Console 접속

```
https://play.google.com/apps/publish/
```

**로그인**: 준비한 Google 계정 사용

### 7.2 개발자 등록 ($25 일회 결제)

#### Step 1: 개발자 계정 생성

1. Play Console 첫 접속 시 "개발자 계정 만들기" 페이지 표시
2. 다음 정보 입력:
   - **개발자 이름**: 회사/개인 이름 (앱에 표시)
   - **이메일**: 연락처 이메일 (수정 가능)
   - **주소**: 국가 선택 후 상세 주소
   - **전화번호**: 휴대폰 번호 (국제 형식)

#### Step 2: 계약 동의

Google Play Developer Agreement 동의:

```
☑ I agree to the Google Play Developer Agreement and Policies
```

#### Step 3: 결제

- **금액**: $25 USD (일회)
- **결제 수단**: 신용카드 (Visa, Mastercard 등)
- **영수증**: 이메일로 발송

#### Step 4: 확인

```bash
# 완료 후 이메일 확인
# "Welcome to Google Play Console!" 메시지 수신
```

### 7.3 개발자 프로필 완성

#### 프로필 정보 수정

```
Play Console → Settings → Account Settings

- Developer Name: 표시 이름
- Email: 연락처
- Website (선택): 회사 웹사이트
- Support Email: 사용자 지원 이메일
```

---

## Step 8: 앱 스토어 등록 및 배포

### 8.1 새 애플리케이션 생성

#### Step 1: 앱 생성 시작

```
Play Console 메인 → "앱 만들기" 또는 "+ 새 앱"
```

#### Step 2: 앱 정보 입력

```
앱 이름: 습관 트래커
기본 언어: 한국어 (또는 English)
앱 또는 게임: 앱 선택
무료 또는 유료: 무료 선택 (초기)
사용 데이터: 확인 후 진행
선언 체크
```

#### Step 3: 프로젝트 생성

```
→ "앱 만들기" 버튼 클릭
→ 대시보드로 이동
```

### 8.2 앱 정보 입력 (좌측 메뉴)

#### 8.2.1 Product Details

```
Play Console → 앱선택 → 설정 → 앱 정보 → 앱 세부정보

내용:
- 앱 이름: 습관 트래커
- 짧은 설명: 일일 습관을 추적하고 관리하세요 (80글자 이하)
- 상세 설명:
  "습관 트래커는 당신의 목표 달성을 돕는 간단하고 효과적한 앱입니다.
   매일의 진행 상황을 시각적으로 확인하고 동기부여를 받을 수 있습니다."
  (4000글자 이하)
```

#### 8.2.2 Screenshots & Graphic Assets

```
Play Console → 앱선택 → 설정 → 앱 정보 → 스토어 세부정보

필수 항목:
- 스크린샷 (최소 2개, 최대 8개)
  * 크기: 1080x1920px (세로) 또는 1920x1080px (가로)
  * 형식: PNG 또는 JPG
  * 앱의 주요 기능을 보여주는 이미지

- 앱 아이콘 (프로덕션 APK/AAB에서 자동 인식)
  * 크기: 512x512px
  * 형식: PNG

- 특징 그래픽 (권장)
  * 크기: 1024x500px
  * Play Store 앱 리스트에 표시
```

**스크린샷 생성 팁**:

```bash
# Android 에뮬레이터에서 스크린샷 저장
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./screenshots/

# 또는 Figma/Photoshop에서 모형 만들기
```

#### 8.2.3 Category & Rating

```
Play Console → 앱선택 → 설정 → 앱 정보 → 콘텐츠 등급

카테고리: 생산성 또는 생활정보
대상 연령: 3세 이상 (기본)
```

#### 8.2.4 개인정보처리방침 & 문의처

```
Play Console → 앱선택 → 설정 → 앱 정보 → 앱 정보

필수:
- 개인정보 보호정책: https://your-domain.com/legal/privacy-policy
- 문의 이메일: support@your-domain.com
- 웹사이트: https://your-domain.com (선택사항)
```

### 8.3 테스트 단계 (필수)

**⚠️ 중요**: Google Play Console의 최신 정책에 따라, 프로덕션 출시 전에 **반드시 테스트 단계를 거쳐야 합니다**. 내부 테스터를 등록하고 Internal Testing을 통해 앱을 배포한 후, 프로덕션 출시가 가능합니다.

#### Step 1: Testing 트랙 접근

```
Play Console → 앱선택 → Testing → Internal Testing
```

#### Step 2: 내부 테스터 등록

```
Testing → Internal Testing → Testers 탭

방법 1: 이메일 주소로 추가 (권장)
- "Create email list" 클릭
- 리스트 이름 입력 (예: "내부 테스터")
- 테스터 이메일 주소 추가 (최소 1명 이상)
  * 본인 Google 계정 이메일 추가 가능
  * 여러 명 추가 가능 (쉼표로 구분)
- "Save changes" 클릭

방법 2: Google 그룹 사용
- 기존 Google 그룹이 있는 경우 그룹 이메일 주소 입력
```

**테스터 추가 예시**:

```
테스터 이메일:
- developer@your-domain.com
- tester1@your-domain.com
- tester2@your-domain.com
```

#### Step 3: 테스트 앱 번들 업로드

```
Testing → Internal Testing → Releases 탭

1. "Create new release" 클릭
2. AAB 파일 업로드
   - 파일 선택: app/build/outputs/bundle/release/app-release.aab
3. Release notes 입력 (선택사항):
   "테스트 버전 1.0
   - 초기 기능 테스트"
4. "Save" 클릭
5. "Review release" 클릭
6. "Start rollout to Internal Testing" 클릭
```

**업로드 완료 후 확인**:

```
- App Signing: "Google Play에서 관리" (기본값 유지)
- Version code: 1 (또는 지정한 버전)
- Version name: 1.0.0
- 상태: "Available to testers"
```

#### Step 4: 테스터에게 앱 설치 링크 공유

```
Testing → Internal Testing → Testers 탭

"Copy link" 버튼 클릭하여 테스트 링크 복사

예시 링크:
https://play.google.com/apps/internaltest/1234567890abcdef

테스터에게 이메일로 링크 전송
```

**테스터 설치 방법**:

1. 테스터가 링크를 클릭하여 Google Play Store 열기
2. "테스터가 되기" 또는 "Become a tester" 버튼 클릭
3. Google Play Store에서 앱 설치
4. 앱 실행 및 테스트

#### Step 5: 테스트 완료 확인

```
Testing → Internal Testing → Dashboard

확인 항목:
- 테스터 수: 등록한 테스터 수 확인
- 설치 수: 테스터들이 앱을 설치했는지 확인
- 피드백: 테스터 피드백 확인 (있는 경우)
```

**테스트 기간**: 최소 1일 이상 권장 (실제 사용 테스트)

### 8.4 프로덕션 출시 준비

**⚠️ 중요**: Internal Testing을 완료한 후에만 Production 출시가 가능합니다.

#### Step 1: Production 트랙 접근

```
Play Console → 앱선택 → Release → Production
```

#### Step 2: 프로덕션 앱 번들 업로드

```
Release → Production → "Create new release" 클릭

1. AAB 파일 업로드
   - 파일 선택: app/build/outputs/bundle/release/app-release.aab
   - (Internal Testing과 동일한 파일 또는 업데이트된 버전)

2. Release notes 입력 (필수):
   "1.0 초기 출시
   - 습관 추가, 추적 기능
   - 진행 통계 표시
   - 오프라인 지원"

3. "Save" 클릭
```

**업로드 완료 후 확인**:

```
- App Signing: "Google Play에서 관리" (기본값 유지)
- Version code: 1 (또는 Internal Testing보다 높은 버전)
- Version name: 1.0.0
```

### 8.5 심사 및 출시

#### Step 1: 배포 국가 선택

```
Release → Production → "Countries" 또는 "배포 국가" 섹션

선택 옵션:
- 전체 국가: 모든 곳에서 이용 가능
- 특정 국가만: 선택적 공개 (한국만 선택 가능)

한국: ✓ 선택 (또는 원하는 국가 선택)
```

#### Step 2: 정가 설정 (무료 앱은 생략)

```
가격 및 배포 → 가격

- 무료: 기본값 유지
- 유료: 가격 설정 (USD 기준)
```

#### Step 3: 심사 신청

```
Release → Production → "Review release" 버튼 클릭

→ 최종 확인 다이얼로그 표시
→ 모든 필수 항목 확인:
  ✓ 앱 정보 입력 완료
  ✓ 스크린샷 업로드 완료
  ✓ 개인정보처리방침 URL 입력 완료
  ✓ 콘텐츠 등급 설정 완료
  ✓ Internal Testing 완료 (필수)

→ "Start rollout to Production" 또는 "출시" 클릭

심사 기간: 보통 24~48시간 (한국은 빠름)
```

**⚠️ 주의**: Internal Testing을 완료하지 않으면 "Start rollout to Production" 버튼이 비활성화되거나 오류가 발생할 수 있습니다.

#### Step 4: 심사 상태 확인

```
Play Console 메인 → 앱 선택 → Release → Production

상태 표시:
- "Pending review" 또는 "검토 중": 심사 진행 중
- "Changes requested" 또는 "변경 요청": 추가 정보 필요
- "Rejected" 또는 "거부됨": 심사 탈락 (이유 확인 후 수정)
- "Available on Google Play" 또는 "활성": 배포 완료
```

**심사 진행 상황 확인**:

```
Play Console → 앱선택 → Release → Production

상세 정보:
- 제출 시간
- 검토 상태
- 예상 완료 시간 (표시되는 경우)
- 거부 사유 (거부된 경우)
```

### 8.6 심사 탈락 시 대응

**자주하는 거부 사유**:

| 사유                       | 해결책                                |
| -------------------------- | ------------------------------------- |
| ❌ 개인정보처리방침 없음   | 프라이버시 정책 URL 추가 후 재신청    |
| ❌ 앱이 웹사이트 링크만    | 최소한 기본 기능 필요 (PWA 기능 추가) |
| ❌ 품질 기준 미달 (크래시) | Lighthouse 점수 확인, 오류 수정       |
| ❌ 광고 정책 위반          | 광고 배치 검토 (권장: 하단, 배너)     |
| ❌ 콘텐츠 정책 위반        | 설명 명확히, 증오/폭력 콘텐츠 제거    |

**재신청**:

```
1. 문제 확인 및 수정
2. 버전 코드 증가 (1 → 2)
3. bubblewrap build로 새 AAB 생성
4. Internal Testing에 새 버전 업로드 (선택사항, 빠른 검증)
5. Production에 새 버전 업로드
6. "Review release" → "Start rollout to Production" 다시 클릭
```

### 8.7 배포 후 관리

#### 앱 업데이트

```
1. Preact 코드 수정
2. npm run build
3. assetlinks.json 재확인
4. bubblewrap build
5. Play Console 새 버전 업로드 (버전 코드 +1)
```

#### 성능 모니터링

```
Play Console → 앱선택 → Analytics

확인 항목:
- 일일 활성 사용자 (DAU)
- 설치 수
- 평가 (별 5개 만점 중)
- 크래시 리포트 (오류 발생 시)
```

#### 사용자 리뷰 관리

```
Play Console → 앱선택 → Reviews

- 별 낮은 리뷰 확인 및 응답
- 버그 보고 시 수정 후 "도움이 되었습니다" 댓글
```

---

## 체크리스트

### ✅ PWA 준비 단계

- [ ] Preact + Vite 프로젝트 생성
- [ ] vite-plugin-pwa 설치 및 설정
- [ ] manifest.webmanifest 생성 (이름, 설명, 아이콘, 색상)
- [ ] Service Worker 동작 확인
- [ ] HTTPS 배포 (도메인 준비)
- [ ] index.html에 메타 태그 추가
- [ ] 아이콘 파일 생성 및 배치 (192x192, 512x512, maskable 포함)
- [ ] 로컬 HTTPS로 PWA 테스트

### ✅ Lighthouse 검증

- [ ] Chrome DevTools Lighthouse 실행
- [ ] PWA 점수 90점 이상 달성
- [ ] 성능 점수 75점 이상
- [ ] 접근성 점수 80점 이상
- [ ] SEO 점수 80점 이상
- [ ] 설치 가능 여부 확인 (✓ 체크)
- [ ] Service Worker 등록 확인 (Application 탭)
- [ ] Manifest 유효성 확인 (Application 탭)

### ✅ 개인정보처리방침

- [ ] 개인정보처리방침 문서 작성
- [ ] 웹사이트에 게시 (https://your-domain.com/legal/privacy-policy)
- [ ] HTTPS로 접근 가능 확인
- [ ] 문의 이메일 명시

### ✅ Bubblewrap 환경

- [ ] Node.js 14+ 설치 확인
- [ ] JDK 11+ 설치 확인
- [ ] Android SDK 설치 확인
- [ ] `bubblewrap --version` 실행 가능 확인
- [ ] `bubblewrap doctor` 모든 체크 통과

### ✅ Bubblewrap 프로젝트

- [ ] 새 디렉토리에서 `bubblewrap init` 실행
- [ ] manifest 입력값 확인 (앱 이름, 패키지명, 색상)
- [ ] 서명키 생성 및 비밀번호 안전 보관
- [ ] `bubblewrap build` 실행 (AAB/APK 생성)
- [ ] app/build/outputs에 파일 생성 확인

### ✅ Digital Asset Links

- [ ] SHA256 핑거프린트 추출
- [ ] assetlinks.json 파일 생성
- [ ] public/.well-known/에 배치
- [ ] 배포 후 HTTPS로 접근 가능 확인
- [ ] Google 검증 도구로 "linked": true 확인

### ✅ Google Play Developer

- [ ] Google 계정 준비
- [ ] Google Play Console 개발자 등록 ($25 결제)
- [ ] 개발자 프로필 완성 (이름, 이메일, 주소)
- [ ] 앱 새로 만들기 (앱 이름, 카테고리 선택)

### ✅ 앱 정보 입력

- [ ] 앱 이름 및 설명 입력
- [ ] 스크린샷 3~5개 업로드 (1080x1920px)
- [ ] 앱 아이콘 확인 (512x512px, PNG)
- [ ] 카테고리 선택 (생산성/생활정보 등)
- [ ] 콘텐츠 등급 설정
- [ ] 개인정보처리방침 URL 입력
- [ ] 문의 이메일 입력
- [ ] 웹사이트 URL 입력 (선택사항)

### ✅ 테스트 단계 (필수)

- [ ] Play Console → Testing → Internal Testing 진입
- [ ] 내부 테스터 등록 (이메일 주소 또는 Google 그룹)
  - 최소 1명 이상 등록 (본인 계정 포함 가능)
- [ ] 테스트용 AAB 파일 업로드
  - app/build/outputs/bundle/release/app-release.aab
- [ ] 테스트 Release notes 입력 (선택사항)
- [ ] "Start rollout to Internal Testing" 클릭
- [ ] 테스터에게 테스트 링크 공유
- [ ] 테스터가 앱 설치 및 테스트 완료 확인
- [ ] 테스트 기간: 최소 1일 이상 권장

### ✅ 프로덕션 출시

- [ ] Play Console → Release → Production 진입
- [ ] 프로덕션용 AAB 파일 업로드
  - Internal Testing과 동일한 파일 또는 업데이트된 버전
- [ ] Version code 확인 (1부터 시작)
- [ ] Release notes 입력 (필수)
- [ ] 배포 국가 선택 (한국 ✓)
- [ ] 정가 설정 (무료/유료)

### ✅ 심사 및 배포

- [ ] "Review release" 클릭
- [ ] 모든 필수 항목 확인:
  - [ ] 앱 정보 입력 완료
  - [ ] 스크린샷 업로드 완료
  - [ ] 개인정보처리방침 URL 입력 완료
  - [ ] 콘텐츠 등급 설정 완료
  - [ ] Internal Testing 완료 (필수)
- [ ] "Start rollout to Production" 또는 "출시" 클릭
- [ ] Play Console에서 상태 "Pending review" 또는 "검토 중" 확인
- [ ] 심사 완료 대기 (24~48시간)
- [ ] 상태 "Available on Google Play" 또는 "활성"으로 변경 확인
- [ ] Google Play Store에서 앱 검색 확인
- [ ] 앱 설치 및 실행 테스트

### ✅ 배포 후 관리

- [ ] Analytics 모니터링 (DAU, 설치 수)
- [ ] 사용자 리뷰 확인 및 응답
- [ ] 크래시 리포트 모니터링
- [ ] 업데이트 일정 계획

---

## 트러블슈팅

### Bubblewrap 관련

#### 문제 1: "JDK not found"

```bash
# 해결책 1: JAVA_HOME 설정
export JAVA_HOME=$(/usr/libexec/java_home -v 11)  # Mac
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64  # Linux

# 해결책 2: JDK 재설치
brew install openjdk@11  # Mac
sudo apt-get install openjdk-11-jdk  # Linux
```

#### 문제 2: "Android SDK not found"

```bash
# 해결책: Android Studio 설치 또는 cmdline-tools 설치
# Android Studio: https://developer.android.com/studio
# 또는 cmdline-tools 수동 설정

export ANDROID_SDK_ROOT=/path/to/android-sdk
```

#### 문제 3: "gradle build failed"

```bash
# 로그 확인
bubblewrap build 2>&1 | tail -50

# Gradle 캐시 초기화
rm -rf android/.gradle
rm -rf ~/.gradle

# 다시 빌드
bubblewrap build
```

### PWA 관련

#### 문제 4: Lighthouse "설치 불가능"

```bash
# 확인 사항:
# 1. HTTPS 필수
# 2. manifest.webmanifest 존재
# 3. Service Worker 등록
# 4. 아이콘 192x192, 512x512 필수
# 5. start_url 정확함

# DevTools에서 확인:
# Application → Manifest → 모든 항목 녹색 체크
```

#### 문제 5: Service Worker 업데이트 안됨

```javascript
// Preact 컴포넌트에서 강제 업데이트 처리
import { useEffect } from 'preact/hooks';

export function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          alert('새 버전 업데이트가 있습니다. 앱을 새로고침하세요.');
        });
      });
    }
  }, []);

  return <div>...앱 콘텐츠...</div>;
}
```

### Play Store 관련

#### 문제 6: "앱 인증 실패" (Digital Asset Links)

```bash
# 재확인 항목:
# 1. assetlinks.json 파일이 .well-known/ 폴더에 있는가?
# 2. HTTPS로 접근 가능한가?
# 3. JSON 형식이 올바른가?
# 4. SHA256이 일치하는가?

# 테스트:
curl -v https://your-domain.com/.well-known/assetlinks.json

# Google 검증:
curl "https://digitalassetlinks.googleapis.com/v1/assetlinks:check?namespace=android_app&package_name=com.yourcompany.appname&relation=delegate_permission/common.handle_all_urls"
```

#### 문제 7: 심사 탈락 - 개인정보처리방침 오류

```bash
# 확인 사항:
# 1. URL이 HTTPS인가?
# 2. 404 오류는 없는가?
# 3. 약관이 명확한가? (수집 목적, 보관 기간, 삭제 방법)
# 4. 연락처 이메일이 명시되어 있는가?

# 재신청: 수정 후 new version upload
```

#### 문제 8: 크래시 리포트

```bash
# Play Console → Analytics → Crashes & ANRs에서 로그 확인
# 일반적인 원인:
# - Preact 라우팅 오류
# - API 호출 실패 (네트워크)
# - 메모리 부족

# 로컬 테스트:
adb logcat | grep E/
```

---

## 참고 자료

### 공식 문서

- [Chrome TWA Quick Start (한국어)](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start?hl=ko)
- [Bubblewrap GitHub](https://github.com/GoogleChromeLabs/bubblewrap)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [Web Manifest Spec](https://www.w3.org/TR/appmanifest/)

### 도구

- [PWA Builder](https://www.pwabuilder.com/) - GUI로 PWA 만들기
- [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)
- [Android Studio](https://developer.android.com/studio)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)

### 한국 개발 커뮤니티

- [한국 프론트엔드 개발자 커뮤니티](https://www.facebook.com/groups/devrelkr)
- [Naver D2](https://d2.naver.com/)
- [Toast Meetup](https://meetup.toast.com/)

---

## 문의 및 피드백

이 가이드에 대한 질문이나 개선사항이 있으면 다음으로 연락하세요:

- **이메일**: support@your-domain.com
- **GitHub Issues**: 프로젝트 저장소
- **커뮤니티**: 한국 개발자 커뮤니티 포럼

---

**문서 버전**: 1.1  
**마지막 업데이트**: 2025년 1월 27일  
**라이선스**: CC-BY-4.0
