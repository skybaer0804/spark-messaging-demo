# 리팩토링 가이드라인

## 목차

1. [상태 관리 원칙](#상태-관리-원칙)
2. [컴포넌트 분리 원칙](#컴포넌트-분리-원칙)
3. [Adapter 패턴](#adapter-패턴)
4. [useSignal 활용 가이드](#usesignal-활용-가이드)
5. [리팩토링 순서](#리팩토링-순서)

---

## 상태 관리 원칙

### 1. useSignal 우선 사용

- **원칙**: Preact의 `useSignal`을 우선적으로 사용하여 필요한 컴포넌트만 리렌더링
- **이유**: 형제 컴포넌트의 불필요한 리렌더링 방지
- **사용 예시**:

  ```tsx
  // ❌ 나쁜 예: useState 사용
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // ✅ 좋은 예: useSignal 사용
  const messages = useSignal<ChatMessage[]>([]);
  ```

### 2. useState 사용 조건

- **사용 가능한 경우**:
  - 컴포넌트 내부에서만 사용되는 UI 상태 (예: 모달 열림/닫힘)
  - 부모 컴포넌트에 영향을 주지 않는 로컬 상태
- **사용 금지**:
  - 여러 컴포넌트에서 공유되는 상태
  - 형제 컴포넌트에 영향을 주는 상태

### 3. Store 패턴

- **목적**: 관련된 상태를 그룹화하여 관리
- **구조**:
  ```
  Store (useSignal 기반)
    ├─ 상태 값들
    ├─ 상태 업데이트 메서드
    └─ 이벤트 리스너
  ```
- **예시**:

  ```tsx
  // ReverseAuctionStore.ts
  export const useReverseAuctionStore = () => {
    const currentRoom = useSignal<Room | null>(null);
    const participants = useSignal<Participant[]>([]);
    const roomList = useSignal<Room[]>([]);

    return {
      currentRoom,
      participants,
      roomList,
      // ... 메서드들
    };
  };
  ```

---

## 컴포넌트 분리 원칙

### 1. 단일 책임 원칙 (SRP)

- 각 컴포넌트는 하나의 책임만 가져야 함
- **분리 기준**:
  - 채팅 기능 → `Chat` 컴포넌트
  - 영상 기능 → `VideoConference` 컴포넌트
  - 역경매 로직 → `ReverseAuctionCore` 컴포넌트

### 2. 독립성 보장

- 각 컴포넌트는 다른 컴포넌트의 리렌더링에 영향을 받지 않아야 함
- **구현 방법**:
  - `memo()` 사용
  - Adapter 패턴으로 상태 주입
  - useSignal으로 필요한 부분만 업데이트

### 3. 컴포넌트 계층 구조

```
ReverseAuction (컨테이너)
  ├─ ReverseAuctionCore (역경매 로직)
  │   ├─ RoomList
  │   ├─ RoomCreateForm
  │   └─ ParticipantManagement
  ├─ VideoConference (영상 - 독립적)
  └─ Chat (채팅 - 독립적)
```

---

## Adapter 패턴

### 1. Adapter의 역할

- 컴포넌트와 비즈니스 로직 사이의 인터페이스
- 컴포넌트는 Adapter를 통해서만 상태와 메서드에 접근
- Adapter는 실제 서비스/훅을 래핑

### 2. Adapter 구조

```tsx
// types/index.ts
export interface ChatAdapter {
  getMessages(): ChatMessage[];
  sendMessage(content: string): Promise<void>;
  isConnected(): boolean;
  // ...
}

// adapters/ReverseAuctionChatAdapter.ts
export class ReverseAuctionChatAdapter implements ChatAdapter {
  private store: ReverseAuctionStore;

  constructor(store: ReverseAuctionStore) {
    this.store = store;
  }

  getMessages(): ChatMessage[] {
    return this.store.chatMessages.value;
  }

  sendMessage(content: string): Promise<void> {
    return this.store.sendChatMessage(content);
  }

  // ...
}
```

### 3. Adapter 사용 규칙

- **컴포넌트**: Adapter 인터페이스만 알고 있어야 함
- **비즈니스 로직**: Store나 Service에 위치
- **Adapter**: Store와 컴포넌트를 연결하는 브릿지 역할

---

## useSignal 활용 가이드

### 1. 기본 사용법

```tsx
import { useSignal } from '@preact/signals';

// Store에서
const messages = useSignal<ChatMessage[]>([]);

// 컴포넌트에서
function ChatMessages({ messages }: { messages: Signal<ChatMessage[]> }) {
  return (
    <div>
      {messages.value.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

### 2. Signal 업데이트

```tsx
// 값 변경
messages.value = [...messages.value, newMessage];

// 배열 업데이트
messages.value = messages.value.filter((m) => m.id !== id);

// 객체 업데이트
room.value = { ...room.value, title: newTitle };
```

### 3. Signal을 Props로 전달

```tsx
// ✅ 좋은 예: Signal 자체를 전달
<ChatMessages messages={store.chatMessages} />

// ❌ 나쁜 예: 값만 전달 (리렌더링 발생)
<ChatMessages messages={store.chatMessages.value} />
```

### 4. computed Signal

```tsx
import { computed } from '@preact/signals';

const filteredMessages = computed(() => messages.value.filter((m) => m.type === 'received'));
```

---

## 리팩토링 순서

### Phase 1: 상태 관리 개선

1. ✅ **useSignal Store 생성**
   - `ReverseAuctionStore` 생성
   - 주요 상태를 useSignal로 전환
   - 기존 useState 제거

2. ✅ **Chat Store 분리**
   - `ChatStore` 생성
   - 채팅 관련 상태만 분리

3. ✅ **Video Store 분리**
   - `VideoStore` 생성
   - 영상 관련 상태만 분리

### Phase 2: Adapter 패턴 적용

4. ✅ **ReverseAuctionChatAdapter 생성**
   - Chat 컴포넌트를 위한 Adapter 구현
   - ReverseAuctionStore와 연결

5. ✅ **ReverseAuctionVideoAdapter 개선**
   - 기존 VideoConferenceAdapter 개선
   - VideoStore와 연결

### Phase 3: 컴포넌트 분리

6. ✅ **Chat 컴포넌트 통합**
   - ReverseAuction에서 Chat 컴포넌트 사용
   - 채팅 관련 로직 제거

7. ✅ **VideoConference 완전 분리**
   - 폴링 방식 제거
   - Adapter를 통한 상태 주입으로 변경

8. ✅ **ReverseAuctionCore 생성**
   - 역경매 특화 로직만 포함
   - 룸 관리, 참가자 관리

### Phase 4: 최적화

9. ✅ **memo 적용**
   - 각 컴포넌트에 memo 적용
   - 불필요한 리렌더링 방지

10. ✅ **성능 테스트**
    - 채팅 입력 시 영상 깜빡임 확인
    - 영상 변경 시 채팅 깜빡임 확인
    - 리렌더링 최소화 확인

---

## 코드 작성 규칙

### 1. 파일 구조

```
components/ReverseAuction/
  ├─ ReverseAuction.tsx (컨테이너)
  ├─ ReverseAuctionCore.tsx (역경매 로직)
  ├─ stores/
  │   ├─ ReverseAuctionStore.ts
  │   ├─ ChatStore.ts
  │   └─ VideoStore.ts
  ├─ adapters/
  │   ├─ ReverseAuctionChatAdapter.ts
  │   └─ ReverseAuctionVideoAdapter.ts
  ├─ Chat/ (Chat 컴포넌트 사용)
  └─ VideoConference/ (VideoConference 컴포넌트)
```

### 2. 네이밍 규칙

- **Store**: `{Domain}Store` (예: `ReverseAuctionStore`)
- **Adapter**: `{Domain}{Component}Adapter` (예: `ReverseAuctionChatAdapter`)
- **Signal**: `{domain}{Property}` (예: `chatMessages`, `currentRoom`)

### 3. 타입 정의

- 모든 Adapter는 인터페이스로 정의
- Store의 메서드는 타입 명시
- Signal 타입은 `Signal<T>` 사용

### 4. 의존성 방향

```
Component → Adapter → Store → Service
```

- 컴포넌트는 Adapter만 의존
- Adapter는 Store만 의존
- Store는 Service만 의존

---

## 체크리스트

리팩토링 완료 후 확인할 사항:

- [ ] 채팅 입력 시 VideoConference 리렌더링 안 됨
- [ ] 영상 변경 시 Chat 리렌더링 안 됨
- [ ] useState 개수가 5개 이하로 감소
- [ ] 각 컴포넌트가 독립적으로 동작
- [ ] Adapter 패턴이 일관되게 적용됨
- [ ] useSignal이 적절히 활용됨
- [ ] 타입 안정성이 보장됨
- [ ] 성능이 개선됨

---

## 사전 준비

### Preact Signals 설치

```bash
npm install @preact/signals
```

### 타입 정의 (TypeScript)

```bash
npm install --save-dev @preact/signals
```

---

## 참고 자료

- [Preact Signals 문서](https://preactjs.com/guide/v10/signals/)
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single-responsibility_principle)
