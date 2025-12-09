# Chat SCSS 리팩토링 가이드

## 문제점

1. **CSS 충돌**: ReverseAuction과 ChatApp의 SCSS 구조가 달라서 Chat 컴포넌트 스타일이 충돌
2. **중복 코드**: ReverseAuction.scss에 채팅 관련 스타일이 중복되어 있음
3. **재사용성 부족**: Chat 컴포넌트의 SCSS가 특정 클래스명에 종속되어 있어 다른 앱에서 재사용 어려움

## 해결 방안

### 1. SCSS Mixin/Placeholder 패턴 사용

Chat 컴포넌트의 스타일을 SCSS placeholder나 mixin으로 변환하여 재사용 가능하게 만들기.

**장점:**

- 하나의 소스코드에서 관리
- classNamePrefix에 관계없이 동일한 스타일 적용
- 각 앱의 SCSS 구조와 독립적으로 동작

### 2. 구조 제안

```
src/components/Chat/
├── Chat.scss (기본 스타일 - placeholder/mixin 정의)
├── styles/
│   ├── _mixins.scss (Chat 스타일 mixin)
│   └── _placeholders.scss (Chat 스타일 placeholder)
└── ...
```

### 3. 사용 방법

#### 방법 1: SCSS Placeholder 사용 (권장)

```scss
// Chat/styles/_placeholders.scss
%chat-base {
    // 모든 Chat 스타일 정의
    &__messages-list { ... }
    &__message { ... }
    // ...
}

// ReverseAuction/ReverseAuction.scss
.reverse-auction {
    &__chat-section {
        @extend %chat-base;
    }
}

// ChatApp/ChatApp.scss
.chat-app {
    &__chat-section {
        @extend %chat-base;
    }
}
```

**문제점**: Placeholder는 한 번만 정의되어야 하므로 여러 곳에서 extend하면 충돌 가능

#### 방법 2: SCSS Mixin 사용 (더 유연함)

```scss
// Chat/styles/_mixins.scss
@mixin chat-styles($prefix: 'chat') {
    .#{$prefix} {
        &__messages-list { ... }
        &__message { ... }
        // ...
    }
}

// Chat/Chat.scss
@include chat-styles('chat');

// ReverseAuction/ReverseAuction.scss
@import '../Chat/styles/mixins';
@include chat-styles('reverse-auction__chat');

// ChatApp/ChatApp.scss
@import '../Chat/styles/mixins';
@include chat-styles('chat-app__chat');
```

**장점:**

- 각 앱에서 독립적으로 스타일 생성
- 충돌 없음
- 하나의 소스코드에서 관리

#### 방법 3: CSS 변수와 클래스 조합 (가장 유연함)

```scss
// Chat/styles/_variables.scss
$chat-primary-color: #667eea;
$chat-secondary-color: #764ba2;
// ...

// Chat/styles/_mixins.scss
@mixin chat-component($prefix) {
  .#{$prefix} {
    &__messages-list {
      // CSS 변수 사용
      background: var(--chat-bg-color, #fafafa);
      // ...
    }
    // ...
  }
}

// 각 앱에서 변수 오버라이드 가능
.reverse-auction {
  --chat-bg-color: #ffffff;
  @include chat-component('reverse-auction__chat');
}
```

## 권장 구조

### 1단계: Chat 스타일을 Mixin으로 변환

```scss
// src/components/Chat/styles/_chat-mixins.scss
@mixin chat-component($prefix: 'chat') {
  .#{$prefix} {
    // 메시지 리스트
    &__messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #fafafa;
      // ...
    }

    // 메시지 아이템
    &__message {
      display: flex;
      flex-direction: column;
      max-width: 70%;
      // ...
    }

    // 입력 영역
    &__input-container {
      display: flex;
      flex-direction: column;
      // ...
    }

    // ... 모든 Chat 스타일
  }
}
```

### 2단계: Chat 컴포넌트에서 기본 스타일 적용

```scss
// src/components/Chat/Chat.scss
@import './styles/chat-mixins';

// 기본 'chat' prefix로 스타일 생성
@include chat-component('chat');
```

### 3단계: 각 앱에서 필요한 prefix로 스타일 생성

```scss
// src/components/ReverseAuction/ReverseAuction.scss
@import '../Chat/styles/chat-mixins';

.reverse-auction {
  // ... 기타 스타일

  // Chat 스타일을 reverse-auction__chat prefix로 생성
  @include chat-component('reverse-auction__chat');

  // ReverseAuction 특화 스타일 오버라이드 가능
  &__chat-section {
    // 특정 스타일만 오버라이드
  }
}
```

```scss
// src/components/ChatApp/ChatApp.scss
@import '../Chat/styles/chat-mixins';

.chat-app {
  // Chat 스타일을 chat-app__chat prefix로 생성
  @include chat-component('chat-app__chat');
}
```

## 구현 단계

1. **Chat/styles/\_chat-mixins.scss 생성**: 현재 Chat.scss의 모든 스타일을 mixin으로 변환
2. **Chat/Chat.scss 수정**: mixin을 import하고 기본 prefix로 사용
3. **ReverseAuction.scss 수정**: 중복된 채팅 스타일 제거, mixin import 및 사용
4. **ChatApp.scss 확인**: 필요시 mixin import 및 사용
5. **테스트**: 각 앱에서 Chat 컴포넌트가 올바르게 스타일링되는지 확인

## 장점

1. **단일 소스**: Chat 스타일을 한 곳에서 관리
2. **재사용성**: 어떤 prefix든 동일한 스타일 적용 가능
3. **독립성**: 각 앱의 SCSS 구조와 독립적으로 동작
4. **유지보수성**: Chat 스타일 변경 시 한 곳만 수정하면 모든 앱에 반영
5. **확장성**: 새로운 앱에서도 쉽게 Chat 컴포넌트 사용 가능
