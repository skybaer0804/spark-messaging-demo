import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 프로젝트 루트 디렉토리
const rootDir = join(__dirname, '..');
const iconsDir = join(rootDir, 'public', 'icons');
const sourceIcon = join(iconsDir, 'spark_icon.png');

// 생성할 아이콘 크기 목록
const iconSizes = [16, 32, 96, 144, 180, 192, 512];

async function generateIcons() {
  try {
    // 소스 아이콘 파일 존재 확인
    if (!existsSync(sourceIcon)) {
      console.error(`❌ 소스 아이콘 파일을 찾을 수 없습니다: ${sourceIcon}`);
      process.exit(1);
    }

    // 아이콘 디렉토리 확인
    if (!existsSync(iconsDir)) {
      mkdirSync(iconsDir, { recursive: true });
    }

    console.log('🎨 아이콘 생성 시작...\n');

    // 각 크기별로 아이콘 생성
    for (const size of iconSizes) {
      const outputPath = join(iconsDir, `spark_icon_${size}.png`);

      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // 투명 배경 유지
        })
        .png({ quality: 100 })
        .toFile(outputPath);

      console.log(`✅ ${size}x${size} 아이콘 생성 완료: spark_icon_${size}.png`);
    }

    // favicon.ico 생성 (32x32 PNG를 favicon.ico로 복사)
    const faviconPath = join(rootDir, 'public', 'favicon.ico');
    await sharp(sourceIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 100 })
      .toFile(faviconPath);

    console.log('✅ favicon.ico 생성 완료');

    console.log('\n✨ 모든 아이콘 생성이 완료되었습니다!');
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();
