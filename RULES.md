# 스타일 가이드

## 디자인 토큰 시스템 (Design Tokens)

3단계 계층 구조를 엄격히 준수합니다.

Primitive: 원시 값 (예: --gray-500, --spacing-4). 직접 사용 금지.

Semantic: 의미적 별칭 (예: --text-primary, --bg-default).

Component: 컴포넌트 전용 (예: --btn-bg, --card-padding).

사용 규칙: 스타일 작성 시 Component 토큰을 최우선으로 사용하고, 없으면 Semantic 토큰을 사용합니다.

하드코딩된 값(Hex, px)이나 Primitive 토큰의 직접 사용을 지양합니다.

## SCSS 및 BEM 네이밍 규칙

- 모든 스타일은 SCSS를 사용합니다.
- CSS 클래스 네이밍은 BEM(Block Element Modifier) 방식을 따릅니다.
  - Block: 독립적인 컴포넌트 단위 (예: `button`, `card`, `header`)
  - Element: Block의 하위 요소 (예: `button__icon`, `card__title`)
  - Modifier: Block 또는 Element의 변형 (예: `button--primary`, `button--disabled`, `card__title--large`)
- 클래스명은 소문자와 하이픈(-)만 사용합니다.
- 중첩은 최대 3단계를 넘지 않도록 합니다.

예시:

```scss
.button {
  &__icon {
    // ...
  }

  &--primary {
    // ...
  }

  &--disabled {
    // ...
  }
}
```

# 컴포넌트 및 로직 가이드

## 컴포넌트 모듈화

- UI 컴포넌트와 로직을 함께 포함하여 모듈화합니다.
- prop 전달을 최소화합니다.
- 레이아웃 모듈화 시 children 및 이벤트 핸들러를 prop으로 전달합니다.

## 함수화 및 재사용성

- 반복되는 로직은 함수로 분리합니다.
- 공통 로직은 유틸리티 함수로 모듈화합니다.
- 컴포넌트는 재사용 가능하도록 설계합니다.
- 단일 책임 원칙을 따릅니다.

## UI 라이브러리

- MUI를 사용할 경우 7버전 이상의 문법을 사용합니다.
- 반응형 디자인을 항상 고려하며, Grid를 우선적으로 사용합니다.

## 코드 구조

- 각 컴포넌트는 자체 스타일 파일(SCSS)을 가집니다.
- 관련 로직은 컴포넌트 내부 또는 별도의 훅/유틸리티로 분리합니다.
- 타입 안정성을 위해 TypeScript를 사용하는 경우 타입을 명시합니다.

# Output Language

Always respond in Korean (한국어).
