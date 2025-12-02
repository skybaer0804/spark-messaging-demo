# 파일 전송 기능 MVP 정의

## 1. 프로젝트 개요

-   **목적**: 채팅에 파일 첨부 기능 추가 (사진, 동영상, 오디오)
-   **핵심 제약**:
    -   ✅ **전송만 수행** (DB 저장 없음)
    -   ✅ **제네릭 설계** (이미지/동영상/오디오 공통 처리)
    -   ✅ **기존 소켓 이벤트 활용** (새로운 이벤트 타입 추가)
    -   ✅ **서비스 레이어 분리** (FileTransferService 신규 생성)

## 2. 지원 파일 타입

| 파일 타입  | 확장자                             | MVP 단계 | 비고      |
| ---------- | ---------------------------------- | -------- | --------- |
| **이미지** | jpg, jpeg, png, gif, webp          | Phase 1  | 즉시 구현 |
| **문서**   | xlsx, xls, csv, md, docx, doc, pdf | Phase 1  | 즉시 구현 |
| **동영상** | mp4, webm, mov                     | Phase 2  | 추후 추가 |
| **오디오** | mp3, wav, ogg                      | Phase 2  | 추후 추가 |

## 3. 아키텍처 설계

### 3.1. 서비스 구조

```
src/
├── services/
│   ├── FileTransferService.ts    # 신규 생성 (파일 전송 전용 서비스)
│   ├── ChatService.ts            # 기존 (텍스트 메시지)
│   └── ConnectionService.ts     # 기존
└── components/
    └── ChatApp/
        ├── hooks/
        │   └── useChatApp.ts     # FileTransferService 통합
        └── ChatApp.tsx           # 파일 첨부 UI 추가
```

### 3.2. FileTransferService 책임

-   파일 선택 및 읽기 처리
-   파일 타입 검증 및 MIME 타입 감지
-   파일을 Base64 또는 ArrayBuffer로 변환
-   소켓을 통한 파일 데이터 전송
-   파일 크기 제한 검증
-   전송 진행 상태 관리 (선택사항)

### 3.3. 데이터 흐름

```
[사용자 파일 선택]
    ↓
[FileTransferService.validateFile()]
    ↓
[FileTransferService.readFileAsBase64()]
    ├─ 진행률 콜백: 0-50% (파일 읽기)
    ↓
[Base64 변환 완료]
    ├─ 진행률 콜백: 50-80% (데이터 준비)
    ↓
[FileTransferService.sendFile()]
    ├─ 진행률 콜백: 80-100% (소켓 전송)
    ↓
[Socket.IO 전송 완료]
    ↓
[수신측: 파일 데이터 수신]
    ↓
[UI에 파일 미리보기 표시]
```

## 4. 소켓 이벤트 설계

### 4.1. 기존 이벤트 활용

기존 `room-message` 이벤트를 활용하되, `type` 필드에 파일 관련 타입 추가:

```typescript
// 파일 전송 메시지 구조
{
  room: string,
  type: 'file-transfer',
  fileData: {
    fileName: string,
    fileType: 'image' | 'document' | 'video' | 'audio',
    mimeType: string,
    size: number,
    data: string, // Base64 인코딩된 파일 데이터
    thumbnail?: string // 이미지의 경우 썸네일 (선택사항)
  },
  timestamp: number,
  senderId: string
}
```

### 4.2. 메시지 타입 확장

```typescript
// Message 타입 확장
export interface Message {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    room?: string;
    senderId?: string;
    fileData?: {
        // 신규 추가
        fileName: string;
        fileType: 'image' | 'document' | 'video' | 'audio';
        mimeType: string;
        size: number;
        data: string; // Base64
        thumbnail?: string;
    };
}
```

## 5. FileTransferService API 설계

### 5.1. 클래스 구조

```typescript
export class FileTransferService {
    // 파일 타입 정의
    static readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    static readonly SUPPORTED_DOCUMENT_TYPES = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel', // xls
        'text/csv', // csv
        'application/csv', // csv (일부 브라우저)
        'text/markdown', // md
        'text/plain', // md (일부 브라우저에서 md 파일을 text/plain으로 인식)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/msword', // doc
        'application/pdf', // pdf
    ];
    static readonly SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
    static readonly SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

    // 파일 크기 제한 (MB)
    static readonly MAX_FILE_SIZE = 10; // 10MB

    // 파일 타입 검증
    validateFile(file: File): { valid: boolean; error?: string };

    // 파일 읽기 및 변환 (진행률 콜백 포함)
    readFileAsBase64(file: File, onProgress?: (progress: number) => void): Promise<string>;

    // 이미지 썸네일 생성 (이미지 타입만)
    generateThumbnail(file: File, maxWidth: number, maxHeight: number): Promise<string>;

    // 파일 전송 (진행률 콜백 포함)
    sendFile(roomId: string, file: File, onProgress?: (progress: number) => void): Promise<void>;

    // 파일 타입 감지
    detectFileType(mimeType: string): 'image' | 'document' | 'video' | 'audio' | 'unknown';
}
```

### 5.2. 메서드 상세

#### validateFile()

-   파일 크기 검증 (MAX_FILE_SIZE)
-   MIME 타입 검증 (지원 타입 확인)
-   파일 존재 여부 확인

#### readFileAsBase64()

-   FileReader API 사용
-   Promise 기반 비동기 처리
-   진행률 콜백 지원 (onProgress)
-   에러 핸들링

#### generateThumbnail()

-   Canvas API 사용
-   이미지 리사이징
-   Base64로 변환

#### sendFile()

-   ChatService의 sendRoomMessage 활용
-   파일 데이터를 JSON으로 직렬화
-   room-message 이벤트로 전송
-   진행률 콜백 지원 (onProgress)
-   전송 단계별 진행률 업데이트

## 6. UI 컴포넌트 설계

### 6.1. 파일 첨부 버튼

```scss
.chat-app__input-container {
    // 기존 스타일 유지
    &__file-button {
        // 파일 첨부 버튼 스타일
    }
}
```

### 6.2. 파일 미리보기

-   **이미지**: 썸네일 표시 (클릭 시 원본 보기)
-   **문서 (엑셀/CSV/MD/Word/PDF)**: 파일 아이콘 + 파일명 + 크기 표시 + 다운로드 버튼
    -   Base64 데이터를 Blob으로 변환
    -   다운로드 링크 생성 및 자동 다운로드
    -   CSV/MD 파일은 텍스트로 미리보기 가능 (선택사항)
    -   PDF 파일은 브라우저에서 미리보기 가능 (선택사항)
-   **동영상**: 썸네일 + 재생 버튼
-   **오디오**: 재생 컨트롤

### 6.3. 파일 전송 UI

```
[입력창] [📎 파일] [전송]
```

파일 선택 시:

```
[입력창] [📎 파일] [전송]
[📷 image.jpg (2.3MB) ✕]  ← 미리보기
```

파일 전송 중:

```
[입력창] [📎 파일] [전송]
[📷 image.jpg (2.3MB) ✕]
[████████░░] 80% 전송 중...  ← 진행률 바
```

### 6.4. 전송 진행률 UI

-   **진행률 바**: 파일 읽기 및 전송 진행률 표시
-   **로딩 인디케이터**: 전송 중 스피너/로딩 아이콘
-   **상태 텍스트**: "읽는 중...", "전송 중...", "완료" 등
-   **취소 버튼**: 전송 중 취소 기능 (선택사항)

#### 진행률 단계

1.  **파일 읽기** (0-50%): Base64 변환 중
2.  **데이터 준비** (50-80%): JSON 직렬화 및 메시지 구성
3.  **소켓 전송** (80-100%): 실제 전송 진행

## 7. MVP 필수 기능 범위

| 순서 | 기능                         | 구현 내용                               | 우선순위 |
| ---- | ---------------------------- | --------------------------------------- | -------- |
| 1    | **FileTransferService 생성** | 파일 전송 로직 모듈화                   | P0       |
| 2    | **이미지 파일 선택**         | input[type="file"] UI 추가              | P0       |
| 3    | **파일 검증**                | 크기, 타입 검증                         | P0       |
| 4    | **Base64 변환**              | 파일 → Base64 인코딩                    | P0       |
| 5    | **소켓 전송**                | room-message로 파일 데이터 전송         | P0       |
| 6    | **파일 수신 처리**           | 수신된 파일 데이터 파싱                 | P0       |
| 7    | **이미지 미리보기**          | 수신된 이미지 표시                      | P0       |
| 8    | **문서 파일 지원**           | 엑셀/CSV/MD/Word/PDF 파일 전송/다운로드 | P0       |
| 9    | **전송 진행률 UI**           | 진행률 바 및 로딩 표시                  | P0       |
| 10   | **썸네일 생성**              | 이미지 썸네일 생성 (선택)               | P1       |
| 11   | **동영상 지원**              | 동영상 파일 전송/재생                   | P2       |
| 12   | **오디오 지원**              | 오디오 파일 전송/재생                   | P2       |

## 8. 기술 스택

-   **파일 읽기**: FileReader API
-   **이미지 처리**: Canvas API (썸네일 생성)
-   **Base64 인코딩**: 브라우저 내장 API
-   **소켓 전송**: 기존 SparkMessaging 클라이언트 활용

## 9. 전송 진행률 구현 상세

### 9.1. 진행률 계산 방식

FileReader API의 `onprogress` 이벤트를 활용하여 파일 읽기 진행률을 추적합니다.

```typescript
// 파일 읽기 진행률 (0-50%)
const reader = new FileReader();
reader.onprogress = (e) => {
    if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 50; // 0-50% 범위
        onProgress?.(progress);
    }
};

// 데이터 준비 단계 (50-80%)
// JSON 직렬화 및 메시지 구성
onProgress?.(75);

// 소켓 전송 단계 (80-100%)
// 실제 전송 완료 시
onProgress?.(100);
```

### 9.2. 진행률 UI 컴포넌트

```typescript
interface FileUploadProgress {
    fileName: string;
    progress: number; // 0-100
    status: 'reading' | 'preparing' | 'uploading' | 'completed' | 'error';
}
```

### 9.3. 진행률 표시 위치

-   파일 미리보기 영역 내부
-   전송 중인 파일 아래에 진행률 바 표시
-   전송 완료 후 진행률 바 제거

## 10. 제약사항 및 고려사항

### 10.1. 파일 크기 제한

-   **소켓 메시지 크기 제한**: 서버 설정에 따라 다름
-   **권장 최대 크기**: 10MB (설정 가능)
-   **초과 시**: 에러 메시지 표시

### 10.2. 메모리 관리

-   Base64 변환 시 메모리 사용량 증가
-   대용량 파일 처리 시 고려 필요
-   전송 완료 후 메모리 해제

### 10.3. 브라우저 호환성

-   FileReader API: 모든 모던 브라우저 지원
-   Canvas API: 이미지 썸네일 생성용

### 10.4. 보안 고려사항

-   파일 타입 검증 (MIME 타입 스푸핑 방지)
-   파일 크기 제한
-   악성 파일 업로드 방지 (클라이언트 측 검증만)

## 11. 성공 기준 (체크리스트)

### Phase 1: 이미지/문서 전송 (MVP)

-   [ ] FileTransferService 생성 및 기본 구조 구현
-   [ ] 파일 선택 UI 추가 (파일 첨부 버튼)
-   [ ] 이미지/문서 파일 검증 (크기, 타입) - 엑셀, CSV, MD, Word, PDF 포함
-   [ ] Base64 변환 기능 구현 (진행률 콜백 포함)
-   [ ] 소켓을 통한 파일 데이터 전송 (진행률 콜백 포함)
-   [ ] 수신측 파일 데이터 파싱
-   [ ] 이미지 미리보기 표시
-   [ ] 문서 파일 다운로드 UI 표시 (엑셀, CSV, MD, Word, PDF)
-   [ ] 전송 진행률 바 UI 구현
-   [ ] 로딩 인디케이터 표시
-   [ ] 에러 처리 (크기 초과, 타입 불일치 등)

### Phase 2: 동영상/오디오 (추후)

-   [ ] 동영상 파일 전송/수신
-   [ ] 동영상 미리보기 및 재생
-   [ ] 오디오 파일 전송/수신
-   [ ] 오디오 재생 컨트롤

## 12. 구현 우선순위

### Week 1: 핵심 기능 구현

1. FileTransferService 클래스 생성
2. 파일 선택 및 검증 로직
3. Base64 변환 및 전송
4. 수신 처리 및 UI 표시

### Week 2: UI 개선 및 최적화

1. 파일 미리보기 UI
2. 전송 진행률 바 구현
3. 로딩 인디케이터 구현
4. 문서 파일 다운로드 UI (엑셀, CSV, MD, Word, PDF)
5. 썸네일 생성 (이미지)
6. 에러 처리 개선

### Week 3: 확장 기능 (선택)

1. 동영상 지원
2. 오디오 지원
3. 전송 진행률 표시 (선택사항)

## 13. 데이터 구조 예시

### 12.1. 전송 메시지 예시

#### 이미지 파일

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"photo.jpg\",\"fileType\":\"image\",\"mimeType\":\"image/jpeg\",\"size\":2048576,\"data\":\"data:image/jpeg;base64,/9j/4AAQSkZJRg...\",\"thumbnail\":\"data:image/jpeg;base64,...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

#### 문서 파일 (엑셀)

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"report.xlsx\",\"fileType\":\"document\",\"mimeType\":\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\",\"size\":5242880,\"data\":\"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAI...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

#### 문서 파일 (CSV)

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"data.csv\",\"fileType\":\"document\",\"mimeType\":\"text/csv\",\"size\":102400,\"data\":\"data:text/csv;base64,bmFtZSxhZ2Usc2NvcmUKSm9obiwyNSw4NQpK...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

#### 문서 파일 (MD)

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"readme.md\",\"fileType\":\"document\",\"mimeType\":\"text/markdown\",\"size\":51200,\"data\":\"data:text/markdown;base64,IyBSZWFkbWU...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

#### 문서 파일 (Word - DOCX)

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"document.docx\",\"fileType\":\"document\",\"mimeType\":\"application/vnd.openxmlformats-officedocument.wordprocessingml.document\",\"size\":2048000,\"data\":\"data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAI...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

#### 문서 파일 (PDF)

```json
{
    "room": "chat-room-123",
    "type": "file-transfer",
    "content": "{\"fileData\":{\"fileName\":\"report.pdf\",\"fileType\":\"document\",\"mimeType\":\"application/pdf\",\"size\":1536000,\"data\":\"data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI...\"}}",
    "timestamp": 1234567890,
    "senderId": "socket-id-123"
}
```

### 12.2. 수신 메시지 파싱

```typescript
// ChatService에서 파일 메시지 처리
if (msg.type === 'file-transfer') {
    const fileData = JSON.parse(msg.content);
    // Message 객체에 fileData 추가
    message.fileData = fileData.fileData;
}
```

## 14. 에러 시나리오

| 시나리오                | 처리 방법                     |
| ----------------------- | ----------------------------- |
| 파일 크기 초과          | 에러 메시지 표시, 전송 취소   |
| 지원하지 않는 파일 타입 | 에러 메시지 표시, 전송 취소   |
| 파일 읽기 실패          | 에러 메시지 표시, 재시도 안내 |
| 소켓 전송 실패          | 에러 메시지 표시, 재시도 옵션 |
| 수신 데이터 파싱 실패   | 에러 로그, 메시지 무시        |

## 15. 확장 가능성

### 향후 개선 사항

1. **파일 압축**: 이미지 압축으로 전송 크기 감소
2. **청크 전송**: 대용량 파일을 여러 청크로 분할 전송
3. **전송 취소**: 전송 중 취소 기능
4. **파일 다운로드**: 수신된 파일 다운로드 기능 (엑셀, CSV, MD, Word, PDF 등)
5. **드래그 앤 드롭**: 파일 드래그 앤 드롭 지원
6. **다중 파일 선택**: 여러 파일 동시 선택 및 전송
7. **재전송 기능**: 실패한 파일 재전송

---

**핵심 원칙**: 전송만 수행하며, DB 저장 없이 실시간 파일 공유에 집중합니다.
