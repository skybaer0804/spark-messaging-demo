// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 파일 타입 아이콘 반환
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎬';
  if (fileType.startsWith('audio/')) return '🎵';
  // 3D 파일 확장자 체크
  if (fileType.includes('stl') || fileType.includes('obj') || fileType.includes('ply') || fileType.includes('dxd')) return '🎲';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('csv')) return '📋';
  if (fileType.includes('markdown') || fileType.includes('md')) return '📝';
  return '📎';
}

// Base64를 Blob으로 변환
export function base64ToBlob(base64Data: string, mimeType: string): Blob {
  const base64 = base64Data.split(',')[1] || base64Data;
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 파일 다운로드 (Base64 또는 URL, 한글 파일명 지원)
export function downloadFile(fileName: string, data: string, mimeType: string): void {
  // URL인 경우 (http:// 또는 https://)
  if (data.startsWith('http://') || data.startsWith('https://')) {
    const link = document.createElement('a');
    link.href = data;
    // 한글 파일명을 올바르게 처리
    link.setAttribute('download', fileName);
    link.target = '_blank'; // 새 탭에서 열기 (CORS 문제 대비)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Base64인 경우
  const blob = base64ToBlob(data, mimeType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // 한글 파일명을 올바르게 처리
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// URL에서 파일 다운로드 (fetch 사용, 모든 파일 타입 지원, 한글 파일명 처리)
export async function downloadFileFromUrl(url: string, fileName: string): Promise<void> {
  try {
    // CORS 문제를 피하기 위해 먼저 직접 링크로 시도
    // 대용량 파일의 경우 fetch가 실패할 수 있으므로 폴백 제공
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Content-Disposition 헤더에서 파일명 추출 시도 (서버에서 제공하는 경우)
      let downloadFileName = fileName;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        // filename*=UTF-8'' 형식 처리
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i);
        if (utf8Match) {
          downloadFileName = decodeURIComponent(utf8Match[1]);
        } else {
          // filename="..." 형식 처리
          const quotedMatch = contentDisposition.match(/filename="(.+)"/);
          if (quotedMatch) {
            downloadFileName = quotedMatch[1];
          } else {
            // filename= 형식 처리
            const unquotedMatch = contentDisposition.match(/filename=([^;]+)/);
            if (unquotedMatch) {
              downloadFileName = unquotedMatch[1].trim();
            }
          }
        }
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      // 한글 파일명을 올바르게 처리
      link.setAttribute('download', downloadFileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 정리 (약간의 지연 후)
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (fetchError) {
      console.warn('Fetch로 다운로드 실패, 직접 링크로 시도:', fetchError);
      // Fetch 실패 시 직접 링크로 다운로드 시도
      const link = document.createElement('a');
      link.href = url;
      // 한글 파일명을 올바르게 처리
      link.setAttribute('download', fileName);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    // 최종 폴백: 새 탭에서 열기
    window.open(url, '_blank');
  }
}
