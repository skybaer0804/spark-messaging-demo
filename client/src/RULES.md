# RULES.md - 스타일 가이드

## 1. 디자인 토큰 3단계 계층 구조

### Primitive (원시값)

- 색상: --gray-50, --gray-100, ..., --gray-900
- 간격: --spacing-4, --spacing-8, --spacing-16, ...
- 테두리: --radius-sm, --radius-base, --radius-lg, ...
- **컴포넌트에서 직접 사용 금지**

### Semantic (의미적 별칭)

- 텍스트: --text-primary, --text-secondary, --text-muted
- 배경: --bg-default, --bg-surface, --bg-alert, --bg-success
- 테두리: --border-default, --border-focus
- **공통 UI 패턴에 사용 (Button, Input, Card 등)**

### Component (컴포넌트 전용)

- --btn-bg, --btn-text, --btn-padding
- --input-border, --input-height
- --card-border, --card-shadow, --card-padding
- **특정 컴포넌트 최적화에만 사용**

## 2. 스타일 수정 규칙

**핵심 원칙**: 개별 SCSS 파일에서 하드코딩된 값을 수정하지 않는다. 모든 스타일 수정은 디자인 토큰 수정을 통해 이루어집니다.

- 스타일 변경 시 `src/styles/tokens/` 내의 해당 **디자인 토큰 값을 직접 수정**하여 프로젝트 전체에 변경 사항이 자동 반영되도록 합니다.
- `ui-components` 및 디자인 시멘틱(Semantic) 토큰은 필요에 따라 자유롭게 수정 및 확장할 수 있습니다.
- 스타일 작성 시 `Component` 토큰을 최우선으로 사용하고, 없으면 `Semantic` 토큰을 사용합니다.

## 3. 컴포넌트 및 로직 가이드

- UI 컴포넌트와 비즈니스 로직을 하나로 묶어 모듈화합니다.
- `props` 전달을 최소화하고, 필요한 데이터는 내부 훅이나 컨텍스트를 통해 해결합니다.
- 레이아웃 모듈화 시에만 `children` 및 이벤트 핸들러를 `props`로 전달합니다.
- 반응형을 항상 고려하여 Grid를 우선적으로 사용합니다.
