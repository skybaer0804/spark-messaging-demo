# 역경매 PoC MVP 정의 (순수 Socket.IO Room 기능)

## 1. 프로젝트 개요

-   **목적**: 수요자가 룸 생성 → 공급자가 실시간 영상/채팅으로 경쟁하는 WebRTC 기반 역경매 PoC
-   **핵심 제약**:
    -   ✅ **웹소켓 서버 수정 0줄** (기존 handler.js 그대로 사용)
    -   ✅ **서버 메모리 룸 관리 X** (Socket.IO 내부 room 기능만 사용)
    -   ✅ **DB/API 없음**, 소켓ID로 유저 구분
    -   ✅ **데이터**: 프론트 JSON 임의값
-   **카테고리**: 인테리어 | 웹개발 | 피규어

## 2. 대상 사용자

| 역할       | 역할 설명 | 주요 기능                             |
| ---------- | --------- | ------------------------------------- |
| **수요자** | 룸 생성자 | 룸생성, 참가요청 승인, 영상/채팅 관람 |
| **공급자** | 룸 참여자 | 룸참가, 웹캠 연결, 실시간 경쟁        |

## 3. MVP 핵심 유스케이스

### 3.1. 룸 생성 (수요자)

카테고리 선택: "인테리어" | "웹개발" | "피규어"

텍스트 입력: "3평 원룸 인테리어 견적 요청"

roomId 생성: room*${Date.now()}*${Math.random().toString(36).substr(2, 9)}

socket.emit('join-room', roomId)

socket.emit('message', {type: 'room-created', roomId, category, title, participants: 1})

text

### 3.2. 룸 리스트 조회 (공통 - 브로드캐스트)

모든 클라이언트가 'message' 이벤트로 룸 정보 수신

프론트에서 roomList[] 배열로 목록 관리

실시간 업데이트: 생성/참가/퇴장 시 자동 갱신

text

### 3.3. 공급자 룸 참가

룸리스트에서 선택 → socket.emit('join-room', roomId)

수요자 미접속 확인 → socket.emit('room-message', {room: roomId, type: 'join-request', from: socket.id})

수요자: 알림 수신 → "승인" 클릭 → room-message(type: 'join-approved')

WebRTC 신호 교환 시작

text

### 3.4. 룸 내 상호작용

[영상 4분할] + [채팅창] + [참가자 목록]

WebRTC: room-message(type: 'webrtc-offer/answer/ice-candidate')

채팅: room-message(type: 'chat', text: '...')

최대 4인 동시 영상 (P2P)

text

## 4. 소켓 이벤트 플로우 (기존 handler.js 사용)

📡 사용 이벤트 (수정없음)
├── join-room(roomId) → 룸 참가
├── leave-room(roomId) → 룸 퇴장
├── room-message({room, type, ...}) → 룸 내 모든 통신
└── message({...}) → 글로벌 룸리스트 업데이트

💬 room-message type 필드
├── room-created → {roomId, category, title, participants: 1}
├── join-request → {from: socketId, category}
├── join-approved → {to: socketId, approved: true}
├── user-joined → {socketId, total: 2}
├── user-left → {socketId, total: 1}
├── webrtc-offer → {sdp, to: socketId} ✅ 구현 완료
├── webrtc-answer → {sdp, to: socketId} ✅ 구현 완료
├── ice-candidate → {candidate, to: socketId} ✅ 구현 완료
└── chat → {text, timestamp}

text

## 5. MVP 필수 기능 범위

| 순서 | 기능          | 소켓 이벤트                              | 프론트 처리                        |
| ---- | ------------- | ---------------------------------------- | ---------------------------------- |
| 1    | **룸 생성**   | `join-room` + `message(room-created)`    | roomId 생성, JSON 저장             |
| 2    | **룸 리스트** | `message(room-list-update)`              | roomList[] 배열 관리               |
| 3    | **참가 요청** | `room-message(join-request)`             | 수요자 알림 UI                     |
| 4    | **참가 승인** | `room-message(join-approved)`            | WebRTC 초기화                      |
| 5    | **WebRTC**    | `room-message(webrtc-*)`                 | offer/answer/ICE 교환 ✅ 구현 완료 |
| 6    | **채팅**      | `room-message(chat)`                     | 채팅창 실시간 추가                 |
| 7    | **퇴장**      | `leave-room` + `room-message(user-left)` | 영상 제거, 목록 갱신               |

## 6. 프론트 데이터 관리 (JSON 임의값)

// 클라이언트 메모리에서만 관리
const mockUsers = {}; // {socketId: {name: '공급자1', role: 'supplier'}}
const roomList = []; // [{roomId, category, title, participants: 2, creatorId}]
const myRooms = {}; // {roomId: true} - 내가 생성한 룸

text

## 7. 화면 구성

📱 초기 화면 (랜딩페이지 X)
┌─────────────────────────────┐
│ [인테리어] [웹개발] [피규어] │ ← 카테고리 탭
│ │
│ 🏠 룸생성 버튼 (수요자) │
│ 📋 룸리스트 (공급자) │
└─────────────────────────────┘

📱 룸 상세 화면
┌─────────────────────────────┐
│ [영상1][영상2] │ ← 4분할 (동적 그리드)
│ [영상3][영상4] │
│ │
│ [채팅창] │
│ > 안녕하세요 │
│ > 견적 50만원 │
│ [입력창] [전송] │
│ [참가요청] [퇴장] │
└─────────────────────────────┘

text

## 8. MVP 제외 기능

🚫 회원가입/로그인 (소켓ID 자동)
🚫 영상 녹화/저장
🚫 결제/낙찰 시스템
🚫 파일 업로드
🚫 모바일 앱
🚫 TURN 서버 (STUN 서버만 사용, 공인IP 가정)
🚫 영상 품질 조절
🚫 서버 상태 관리 (Socket.IO 내부 room만)

text

## 9. 성공 기준 (체크리스트)

✅ [ ] 수요자: 룸생성 → 룸리스트에 표시
✅ [ ] 공급자3명: 룸참가 → 4화면 영상 동시 출력
✅ [ ] 채팅: 실시간 송수신 확인
✅ [ ] 수요자 미접속 → 공급자 요청 → 승인 → 자동 연결
✅ [ ] 참가자 퇴장 → 영상 자동 제거 + 목록 갱신
✅ [ ] 브라우저 재접속 → 룸리스트 유지
✅ [x] 최대 4인 동시 WebRTC 연결 안정 (구현 완료)

text

## 10. 구현 우선순위

Week 1: 룸생성 → 룸리스트 → 참가/퇴장
Week 2: 참가요청/승인 → WebRTC 1:1 연결
Week 3: 다중영상(4분할) + 채팅 → 테스트

text

**웹소켓 수정 없이 바로 구현 가능. 프론트 로직만 작성하면 PoC 완성!**
