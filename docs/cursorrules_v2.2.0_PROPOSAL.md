# .cursorrules v2.2.0 수정 제안

**현재 .cursorrules**에 추가/수정할 내용을 명시합니다.
기존 "스타일 가이드" 섹션은 그대로 유지하고, 아래 항목들을 **추가**합니다.

---

## 📌 추가될 섹션 (8개)

### 1. Socket & Real-time 개발 규칙

#### Socket 이벤트 네이밍 컨벤션

**클라이언트 → 서버 (요청)**:
- `REQUEST_MESSAGES` - 메시지 조회
- `REQUEST_SYNC` - 누락 메시지 동기화
- `CHAT_ENTER_ROOM` - 방 입장
- `CHAT_LEAVE_ROOM` - 방 퇴출

**서버 → 클라이언트 (브로드캐스트)**:
- `ROOM_LIST_UPDATED` - 채팅방 목록 업데이트
- `MESSAGE_ADDED` - 새 메시지 추가
- `MESSAGE_DELETED` - 메시지 삭제
- `NOTIFICATION_RECEIVED` - 알림 수신
- `MEETING_STARTED` - 회의 시작
- `UNREAD_COUNT_UPDATED` - 안읽음 카운트 변경

#### 메시지 시퀀싱 규칙

```typescript
interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'image';
  
  // [필수] 메시지 시퀀스 - 방 내에서 1씩 증가
  sequenceNumber: number;
  
  // [선택] 낙관적 업데이트용
  tempId?: string;
  status?: 'sending' | 'sent' | 'failed';
  
  // 읽음 추적
  readBy: string[];
  timestamp: Date;
}
```

---

### 2. 낙관적 업데이트 (Optimistic Update) 패턴

#### 구현 Step

```typescript
// Step 1: 클라이언트에서 tempId 생성
const tempId = `temp_${Date.now()}_${Math.random()}`;

// Step 2: 즉시 UI에 렌더링 (status: 'sending')
setMessages(prev => [...prev, {
  tempId,
  content,
  status: 'sending'
}]);

// Step 3: 서버 전송
const response = await chatAPI.sendMessage({ content, tempId });

// Step 4: 성공 시 tempId → 실제 _id 매핑
setMessages(prev =>
  prev.map(msg =>
    msg.tempId === tempId
      ? { ...response.message, status: 'sent' }
      : msg
  )
);

// Step 5: 실패 시 status → 'failed'
// ... error handling
```

---

### 3. Reconnection Sync 패턴

```typescript
// 마지막 시퀀스 번호를 서버에 전송
const syncMessages = async () => {
  const lastSeq = lastSequenceRef.current;
  const response = await chatAPI.syncMessages({
    roomId,
    fromSequence: lastSeq
  });
  
  // 누락 메시지 병합 (시퀀스 순 정렬)
  setMessages(prev => {
    const combined = [...prev, ...response.messages];
    const sorted = combined.sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    return Array.from(
      new Map(sorted.map(m => [m.sequenceNumber, m])).values()
    );
  });
};

// 네트워크 재연결 감지 시 자동 동기화
socketService.on('reconnect', syncMessages);
```

---

### 4. 에러 처리 & 로깅

#### 에러 분류

**NetworkError** (서버 연결 불가)
- 처리: 재시도 로직 (exponential backoff)
- 로깅: ERROR 레벨

```typescript
const sendWithRetry = async (msg, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await chatAPI.sendMessage(msg);
    } catch (err) {
      if (isNetworkError(err)) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        logger.warn(`Retrying in ${delay}ms`, { attempt: i + 1 });
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
};
```

**ValidationError** (입력값 오류)
- 처리: 사용자 피드백, UI 하이라이트
- 로깅: WARN 레벨

**ServerError** (500, 503)
- 처리: 자동 재시도 + 사용자 알림
- 로깅: ERROR 레벨

#### 로깅 규칙

```typescript
// 디버그 로깅 (개발 모드)
if (process.env.NODE_ENV === 'development') {
  socketService.on('*', (event, data) => {
    logger.debug(`[Socket] ${event}`, data);
  });
}

// 핵심 작업 로깅
logger.info(`[Chat] Sending message to room: ${roomId}`);
logger.warn(`[Chat] Message gap detected`, { missing });
logger.error(`[Chat] Sync failed:`, error);
```

---

### 5. 테스트 작성 규칙

#### 테스트 파일 위치

```
src/domains/Chat/
├── components/ChatList/
│   ├── ChatList.tsx
│   └── __tests__/
│       └── ChatList.test.tsx
├── hooks/
│   ├── useChatRoom.ts
│   └── __tests__/
│       └── useChatRoom.test.ts
```

#### 테스트 타이틀 컨벤션

```typescript
describe('ChatMessage', () => {
  it('should render without crashing', () => {});
  it('should update status to sent after API response', () => {});
  it('should display checkmark when status is sent', () => {});
  it('should show error when network fails', () => {});
});
```

#### 컴포넌트 테스트 템플릿

```typescript
import { render, screen } from '@testing-library/react';

describe('ChatMessage', () => {
  it('should render message content', () => {
    render(<ChatMessage message={mockMessage} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('should display checkmark when status is sent', () => {
    render(<ChatMessage message={{ ...mockMessage, status: 'sent' }} />);
    expect(screen.getByText('✓ 전송됨')).toBeInTheDocument();
  });
});
```

#### 훅 테스트 템플릿

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useOptimisticUpdate', () => {
  it('should send message optimistically', async () => {
    const { result } = renderHook(() => useOptimisticUpdate());
    
    act(() => {
      result.current.sendMessage('room-1', 'Hello');
    });
    
    expect(result.current.messages[0].status).toBe('sending');
  });
  
  it('should update status to sent after API response', async () => {
    // ... test implementation
    await waitFor(() => {
      expect(result.current.messages[0].status).toBe('sent');
    });
  });
});
```

---

### 6. 성능 최적화

#### 메시지 리스트 가상화 (1000+ 메시지)

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <ChatMessage message={messages[index]} style={style} />
  )}
</FixedSizeList>
```

#### 메모리 누수 방지

```typescript
useEffect(() => {
  socketService.on('NEW_MESSAGE', handleNewMessage);
  
  // ✅ 필수: cleanup 함수에서 리스너 제거
  return () => {
    socketService.off('NEW_MESSAGE', handleNewMessage);
  };
}, []);
```

**필수 정리 항목**:
- [ ] Socket 이벤트 리스너 제거
- [ ] setTimeout/setInterval 정리
- [ ] 구독(subscription) 해제

---

### 7. 도메인별 구조

```
src/domains/
├── Chat/
│   ├── components/
│   │   ├── ChatList/
│   │   ├── ChatWindow/
│   │   └── ChatMessage/
│   ├── hooks/
│   │   ├── useChatRoom.ts
│   │   ├── useChatRooms.ts
│   │   ├── useMessageSync.ts
│   │   └── useOptimisticUpdate.ts
│   ├── types/
│   │   └── chat.types.ts
│   ├── utils/
│   └── __tests__/
├── Notification/
└── VideoMeeting/
```

**Barrel Export** (각 도메인의 index.ts):

```typescript
// src/domains/Chat/index.ts
export { ChatList } from './components/ChatList/ChatList';
export { ChatWindow } from './components/ChatWindow/ChatWindow';
export { useChatRooms } from './hooks/useChatRooms';
export { useMessageSync } from './hooks/useMessageSync';
export type { Message, ChatRoom } from './types/chat.types';
```

---

### 8. 타입 안정성

#### 도메인별 타입

```typescript
// src/domains/Chat/types/chat.types.ts
export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  content: string;
  sequenceNumber: number;
  tempId?: string;
  status?: MessageStatus;
  readBy: string[];
  timestamp: Date;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatRoom {
  _id: string;
  name: string;
  members: string[];
  lastMessage?: Message;
  isGroup: boolean;
  createdAt: Date;
}

export interface UserChatRoom {
  userId: string;
  roomId: string;
  unreadCount: number;
  isPinned: boolean;
  notificationEnabled: boolean;
}
```

#### API 응답 타입

```typescript
export interface MessageResponse {
  message: Message;
  tempId?: string;
  sequenceNumber: number;
}

export interface SyncResponse {
  messages: Message[];
  count: number;
}
```

#### 훅 반환 타입

```typescript
export interface UseOptimisticUpdateReturn {
  messages: Message[];
  sendMessage: (roomId: string, content: string) => Promise<void>;
  retryMessage: (message: Message) => Promise<void>;
}
```

---

## 최종 .cursorrules 구조

```
.cursorrules (v2.2.0)

## 스타일 가이드 (기존 유지)
   - 디자인 토큰 시스템
   - SCSS & BEM
   - 컴포넌트 모듈화

## Socket & Real-time 개발 규칙 (NEW)
## 낙관적 업데이트 & Reconnection Sync (NEW)
## 에러 처리 & 로깅 (NEW)
## 테스트 작성 규칙 (NEW)
## 성능 최적화 (NEW)
## 도메인별 구조 (NEW)
## 타입 안정성 (NEW)

# Output Language: Korean
```

---

## 적용 방법

1. 기존 `.cursorrules` 백업
2. 위의 8개 섹션을 추가
3. 팀 리뷰 진행
4. PR로 병합

이를 통해 **팀 전체가 동일한 개발 기준**을 따르고, **온보딩 시간 단축** 및 **코드 품질 일관성 유지**가 가능합니다.
