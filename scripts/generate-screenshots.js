import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트 디렉토리
const rootDir = join(__dirname, '..');
const screenshotsDir = join(rootDir, 'public');
const sourceIcon = join(rootDir, 'public', 'asset', 'spark_icon_512.png');

// 스크린샷 크기 정의
const screenshots = [
  {
    name: 'screenshot-1',
    width: 540,
    height: 720,
    formFactor: 'narrow', // 세로 (모바일)
  },
  {
    name: 'screenshot-2',
    width: 1280,
    height: 720,
    formFactor: 'wide', // 가로 (태블릿/데스크톱)
  },
];

async function generateScreenshots() {
  try {
    // 소스 아이콘 파일 존재 확인
    if (!existsSync(sourceIcon)) {
      console.error(`❌ 소스 아이콘 파일을 찾을 수 없습니다: ${sourceIcon}`);
      process.exit(1);
    }

    console.log('📸 스크린샷 생성 시작...\n');

    // 각 스크린샷 생성
    for (const screenshot of screenshots) {
      const outputPath = join(screenshotsDir, `${screenshot.name}.png`);

      // 배경색: theme_color와 유사한 어두운 색상
      const backgroundColor = { r: 26, g: 26, b: 46, alpha: 1 }; // #1a1a2e

      // 아이콘을 중앙에 배치한 스크린샷 생성
      const iconSize = Math.min(screenshot.width, screenshot.height) * 0.4; // 화면의 40% 크기
      const iconX = (screenshot.width - iconSize) / 2;
      const iconY = (screenshot.height - iconSize) / 2;

      // 배경 생성
      const background = sharp({
        create: {
          width: screenshot.width,
          height: screenshot.height,
          channels: 4,
          background: backgroundColor,
        },
      });

      // 아이콘 리사이즈
      const icon = await sharp(sourceIcon)
        .resize(Math.round(iconSize), Math.round(iconSize), {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      // 배경과 아이콘 합성
      await background
        .composite([
          {
            input: icon,
            left: Math.round(iconX),
            top: Math.round(iconY),
          },
        ])
        .png({ quality: 90 })
        .toFile(outputPath);

      console.log(
        `✅ ${screenshot.width}x${screenshot.height} 스크린샷 생성 완료: ${screenshot.name}.png (${screenshot.formFactor})`
      );
    }

    console.log('\n✨ 모든 스크린샷 생성이 완료되었습니다!');
    console.log('\n💡 참고: 실제 앱 화면을 캡처하여 이 파일들을 교체하는 것을 권장합니다.');
  } catch (error) {
    console.error('❌ 스크린샷 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateScreenshots();

