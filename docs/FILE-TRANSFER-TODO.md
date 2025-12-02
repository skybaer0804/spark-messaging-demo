# 파일 전송 기능 개발 TODO

## Phase 1: 핵심 기능 구현 (MVP)

### 1. FileTransferService 생성

-   [ ] `src/services/FileTransferService.ts` 파일 생성
-   [ ] 클래스 기본 구조 작성
    -   [ ] 생성자 (client, connectionService 주입)
    -   [ ] 정적 상수 정의 (지원 파일 타입, 최대 크기)
    -   [ ] 문서 파일 타입 상수 추가 (xlsx, xls, csv, md, docx, doc, pdf)
-   [ ] 파일 타입 감지 메서드 구현 (`detectFileType()`)
    -   [ ] 'document' 타입 추가 (엑셀, CSV, MD, Word, PDF 파일)
-   [ ] 파일 검증 메서드 구현 (`validateFile()`)
    -   [ ] 파일 크기 검증
    -   [ ] MIME 타입 검증
    -   [ ] 에러 메시지 반환
-   [ ] Base64 변환 메서드 구현 (`readFileAsBase64()`)
    -   [ ] FileReader API 사용
    -   [ ] Promise 기반 비동기 처리
    -   [ ] 진행률 콜백 지원 (onProgress)
    -   [ ] FileReader.onprogress 이벤트 처리
    -   [ ] 에러 핸들링
-   [ ] 이미지 썸네일 생성 메서드 구현 (`generateThumbnail()`)
    -   [ ] Canvas API 사용
    -   [ ] 이미지 리사이징 로직
    -   [ ] Base64 변환
-   [ ] 파일 전송 메서드 구현 (`sendFile()`)
    -   [ ] ChatService의 sendRoomMessage 활용
    -   [ ] 파일 데이터 JSON 직렬화
    -   [ ] room-message 이벤트로 전송
    -   [ ] 진행률 콜백 지원 (onProgress)
    -   [ ] 전송 단계별 진행률 업데이트 (읽기 0-50%, 준비 50-80%, 전송 80-100%)
-   [ ] cleanup 메서드 구현

### 2. 타입 정의 확장

-   [ ] `src/components/ChatApp/types/Message.ts` 수정
    -   [ ] `fileData` 필드 추가
    -   [ ] `FileData` 인터페이스 정의
-   [ ] `src/services/ChatService.ts` 수정
    -   [ ] `ChatMessage` 인터페이스에 `fileData` 필드 추가
-   [ ] 파일 타입 enum 또는 union type 정의
    -   [ ] 'document' 타입 추가

### 3. ChatService 파일 메시지 처리

-   [ ] `src/services/ChatService.ts` 수정
    -   [ ] `onRoomMessage()` 메서드에서 파일 메시지 처리 로직 추가
    -   [ ] `type === 'file-transfer'` 케이스 처리
    -   [ ] 파일 데이터 파싱 및 Message 객체에 추가
-   [ ] `onMessage()` 메서드에도 동일한 로직 추가 (일반 메시지용)

### 4. useChatApp 훅 통합

-   [ ] `src/components/ChatApp/hooks/useChatApp.ts` 수정
    -   [ ] FileTransferService 인스턴스 생성 및 ref 관리
    -   [ ] useEffect에서 FileTransferService 초기화
    -   [ ] cleanup에서 FileTransferService 정리
-   [ ] 파일 전송 함수 추가 (`sendFile()`)
    -   [ ] 현재 룸 확인
    -   [ ] FileTransferService.sendFile() 호출
    -   [ ] 에러 처리
-   [ ] 파일 전송 상태 관리
    -   [ ] 전송 중 상태 (isUploading)
    -   [ ] 전송 진행률 상태 (uploadProgress: 0-100)
    -   [ ] 전송 중인 파일 정보 (uploadingFile)
    -   [ ] 전송 완료 상태
    -   [ ] 에러 상태

### 5. ChatApp UI 컴포넌트 수정

-   [ ] `src/components/ChatApp/ChatApp.tsx` 수정
    -   [ ] 파일 첨부 버튼 추가 (입력창 옆)
    -   [ ] 숨겨진 파일 input 요소 추가
    -   [ ] 파일 선택 핸들러 구현 (`handleFileSelect()`)
    -   [ ] 파일 미리보기 UI 추가
        -   [ ] 선택된 파일 목록 표시
        -   [ ] 파일 제거 버튼
        -   [ ] 파일 크기 표시
        -   [ ] 파일 타입 아이콘 표시 (이미지/문서 등)
-   [ ] 파일 전송 함수 연결
    -   [ ] useChatApp의 sendFile 함수 사용
    -   [ ] 파일 선택 후 전송 버튼 클릭 시 전송
    -   [ ] 전송 진행률 콜백 연결
-   [ ] 전송 진행률 UI 추가
    -   [ ] 진행률 바 컴포넌트 (`.chat-app__progress-bar`)
    -   [ ] 진행률 퍼센트 표시
    -   [ ] 로딩 스피너/인디케이터
    -   [ ] 상태 텍스트 ("읽는 중...", "전송 중...", "완료")
    -   [ ] 전송 중 파일 정보 표시

### 6. 메시지 표시 UI 수정

-   [ ] `src/components/ChatApp/ChatApp.tsx` 수정
    -   [ ] 메시지 렌더링 로직 수정
    -   [ ] `fileData`가 있는 경우 파일 미리보기 표시
        -   [ ] 이미지: `<img>` 태그로 표시
        -   [ ] 문서 파일 (엑셀/CSV/MD/Word/PDF): 파일 아이콘 + 다운로드 버튼
        -   [ ] 동영상: `<video>` 태그로 표시 (Phase 2)
        -   [ ] 오디오: `<audio>` 태그로 표시 (Phase 2)
    -   [ ] 파일 다운로드 기능 구현
        -   [ ] Base64 데이터를 Blob으로 변환
        -   [ ] 다운로드 링크 생성 및 클릭 이벤트
        -   [ ] 파일 이름 및 크기 표시

### 7. 스타일 추가

-   [ ] `src/components/ChatApp/ChatApp.scss` 수정
    -   [ ] 파일 첨부 버튼 스타일 (`.chat-app__file-button`)
    -   [ ] 파일 미리보기 컨테이너 스타일 (`.chat-app__file-preview`)
    -   [ ] 파일 미리보기 아이템 스타일 (`.chat-app__file-preview-item`)
    -   [ ] 파일 제거 버튼 스타일 (`.chat-app__file-remove`)
    -   [ ] 메시지 내 파일 표시 스타일 (`.chat-app__message-file`)
    -   [ ] 이미지 미리보기 스타일 (`.chat-app__message-image`)
    -   [ ] 문서 파일 표시 스타일 (`.chat-app__message-document`) - 엑셀, CSV, MD, Word, PDF
    -   [ ] 전송 진행률 바 스타일 (`.chat-app__progress-bar`)
    -   [ ] 진행률 바 컨테이너 (`.chat-app__progress-container`)
    -   [ ] 진행률 퍼센트 텍스트 (`.chat-app__progress-text`)
    -   [ ] 로딩 인디케이터 스타일 (`.chat-app__loading-indicator`)
    -   [ ] 반응형 디자인 고려

### 8. 유틸리티 함수 (선택사항)

-   [ ] `src/utils/fileUtils.ts` 생성
    -   [ ] 파일 크기 포맷팅 함수 (`formatFileSize()`)
    -   [ ] 파일 타입 아이콘 반환 함수 (`getFileIcon()`)
    -   [ ] MIME 타입 검증 함수 (`isValidMimeType()`)
    -   [ ] Base64를 Blob으로 변환 함수 (`base64ToBlob()`)
    -   [ ] 파일 다운로드 함수 (`downloadFile()`)

### 9. 에러 처리

-   [ ] FileTransferService 에러 처리
    -   [ ] 파일 크기 초과 에러
    -   [ ] 지원하지 않는 파일 타입 에러
    -   [ ] 파일 읽기 실패 에러
    -   [ ] 소켓 전송 실패 에러
-   [ ] UI 에러 메시지 표시
    -   [ ] alert 또는 toast 메시지
    -   [ ] 사용자 친화적인 에러 메시지

### 10. 테스트 및 검증

-   [ ] 이미지 파일 전송 테스트
    -   [ ] jpg 파일 전송
    -   [ ] png 파일 전송
    -   [ ] gif 파일 전송
    -   [ ] webp 파일 전송
-   [ ] 문서 파일 전송 테스트
    -   [ ] xlsx 파일 전송
    -   [ ] xls 파일 전송
    -   [ ] csv 파일 전송
    -   [ ] md 파일 전송
    -   [ ] docx 파일 전송
    -   [ ] doc 파일 전송
    -   [ ] pdf 파일 전송
    -   [ ] 문서 파일 다운로드 테스트 (엑셀, CSV, MD, Word, PDF)
-   [ ] 파일 크기 제한 테스트
    -   [ ] 최대 크기 이하 파일 전송
    -   [ ] 최대 크기 초과 파일 전송 (에러 확인)
-   [ ] 파일 타입 검증 테스트
    -   [ ] 지원하지 않는 파일 타입 선택 (에러 확인)
-   [ ] 다중 클라이언트 테스트
    -   [ ] 여러 브라우저에서 파일 전송/수신 확인
-   [ ] 메모리 누수 확인
    -   [ ] 파일 전송 후 메모리 해제 확인
-   [ ] 전송 진행률 UI 테스트
    -   [ ] 진행률 바 표시 확인
    -   [ ] 진행률 퍼센트 업데이트 확인
    -   [ ] 로딩 인디케이터 표시 확인
    -   [ ] 전송 완료 후 UI 상태 확인

## Phase 2: 확장 기능 (추후)

### 11. 동영상 파일 지원

-   [ ] FileTransferService에 동영상 타입 추가
-   [ ] 동영상 파일 검증 로직 추가
-   [ ] 동영상 미리보기 UI 추가
-   [ ] 동영상 재생 컨트롤 추가
-   [ ] 동영상 썸네일 생성 (선택사항)

### 12. 오디오 파일 지원

-   [ ] FileTransferService에 오디오 타입 추가
-   [ ] 오디오 파일 검증 로직 추가
-   [ ] 오디오 재생 UI 추가
-   [ ] 오디오 재생 컨트롤 추가

### 13. UI 개선

-   [ ] 전송 취소 기능 (전송 중 취소 버튼)
-   [ ] 드래그 앤 드롭 지원
-   [ ] 다중 파일 선택 지원
-   [ ] 전송 실패 시 재시도 기능

### 14. 최적화

-   [ ] 이미지 압축 기능 추가
-   [ ] 썸네일 품질 최적화
-   [ ] 대용량 파일 처리 개선
-   [ ] 메모리 사용량 최적화

## 구현 체크리스트 요약

### 필수 구현 항목 (Phase 1)

1. ✅ FileTransferService 클래스 생성 및 기본 메서드 구현
2. ✅ 타입 정의 확장 (Message, ChatMessage) - 문서 파일 타입 포함 (엑셀, CSV, MD, Word, PDF)
3. ✅ ChatService 파일 메시지 처리 로직 추가
4. ✅ useChatApp 훅에 FileTransferService 통합
5. ✅ ChatApp UI에 파일 첨부 버튼 및 미리보기 추가
6. ✅ 메시지 표시 UI에 파일 렌더링 추가 (이미지 + 문서 파일)
7. ✅ 전송 진행률 UI 구현 (진행률 바 + 로딩 인디케이터)
8. ✅ 문서 파일 다운로드 기능 구현 (엑셀, CSV, MD, Word, PDF)
9. ✅ 스타일 추가 (SCSS)
10. ✅ 에러 처리 구현
11. ✅ 기본 테스트 완료

### 선택 구현 항목 (Phase 2)

-   동영상/오디오 지원
-   전송 취소 기능
-   드래그 앤 드롭
-   다중 파일 선택
-   파일 압축
-   재전송 기능

## 개발 순서 권장사항

1. **타입 정의 먼저** → Message 타입 확장 (문서 파일 타입 포함: 엑셀, CSV, MD, Word, PDF)
2. **서비스 레이어** → FileTransferService 구현 (진행률 콜백 포함)
3. **서비스 통합** → ChatService 파일 처리 로직 추가
4. **훅 통합** → useChatApp에 FileTransferService 연결 (진행률 상태 관리)
5. **UI 구현** → 파일 첨부 버튼 및 미리보기
6. **진행률 UI** → 전송 진행률 바 및 로딩 인디케이터
7. **메시지 표시** → 수신된 파일 렌더링 (이미지 + 문서 파일)
8. **다운로드 기능** → 문서 파일 다운로드 구현 (엑셀, CSV, MD, Word, PDF)
9. **스타일링** → SCSS 스타일 추가
10. **테스트** → 각 기능별 테스트

## 주의사항

-   파일 크기 제한을 명확히 설정하고 사용자에게 알림
-   Base64 인코딩으로 인한 메모리 사용량 증가 고려
-   대용량 파일 전송 시 브라우저 성능 영향 고려
-   전송 진행률은 실제 전송 단계를 반영하도록 구현
-   FileReader.onprogress 이벤트를 활용하여 정확한 진행률 표시
-   진행률 바는 부드럽게 업데이트되도록 구현
-   에러 메시지는 사용자 친화적으로 작성
-   BEM 네이밍 규칙 준수
-   반응형 디자인 고려
-   문서 파일(엑셀, CSV, MD, Word, PDF)은 다운로드만 가능 (브라우저에서 직접 열기 불가)
-   CSV/MD 파일은 텍스트로 미리보기 가능 (선택사항, 향후 구현)
-   PDF 파일은 브라우저에서 미리보기 가능 (선택사항, 향후 구현)
