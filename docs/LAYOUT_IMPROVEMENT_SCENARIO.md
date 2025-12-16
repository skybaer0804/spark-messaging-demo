# 레이아웃 개선 시나리오 문서

## 📋 현재 상태 분석

### 1. TokenProvider 현황
- **위치**: `src/context/TokenProvider.tsx`
- **기능**: 
  - 기본 theme (light/dark) 관리
  - contrast (standard/high) 관리
  - deviceSize 감지
- **부족한 점**:
  - localStorage 저장 기능 없음
  - 테마 프리셋 관리 없음
  - 색상/모양 커스터마이징 기능 없음
  - 초기값 복원 기능 없음

### 2. Sidebar 현황
- **위치**: `src/components/Sidebar/Sidebar.tsx`
- **현재 기능**:
  - 기본 메뉴 네비게이션
  - active 상태 표시
- **부족한 점**:
  - 미니 드로우 모드 없음
  - 호버 시 펼쳐짐 기능 없음
  - 고정핀 기능 없음
  - ui-component 미사용 (List 등)
  - 미니 드로우 시 아이콘 하단 텍스트 배치 없음
  - active 시 폰트 색상 변경 (아이콘만 변경되어야 함)

### 3. Header 현황
- **위치**: `src/layouts/Header/Header.tsx`
- **현재 기능**:
  - 제목 표시
  - 연결 상태 표시
  - 테마/대비 토글 (이모지 사용)
- **부족한 점**:
  - Tabler 아이콘 미사용
  - ui-component 미사용
  - 다크모드/라이트모드/고대비 모드별 적절한 아이콘 미적용

### 4. 테마 시스템 현황
- **위치**: `src/styles/tokens/`
- **현재 구조**:
  - Primitive → Semantic → Component 토큰 계층 구조
  - SCSS 변수 시스템
- **부족한 점**:
  - 동적 색상 변경 기능 없음
  - Shape (border-radius) 변경 기능 없음
  - 테마 프리셋 시스템 없음
  - 테마 커스터마이징 UI 없음

---

## 🎯 개선 목표

### Phase 1: 구조적 안정성 (TokenProvider 개선)
1. localStorage 연동으로 설정 영구 저장
2. 테마 프리셋 시스템 구축
3. 색상/모양 커스터마이징 기능 추가
4. 초기값 복원 기능

### Phase 2: Sidebar 개선
1. 미니 드로우 모드 구현
2. 호버 시 펼쳐짐 기능
3. 고정핀 기능 (localStorage 연동)
4. ui-component 적용 (List, ListItem 등)
5. 미니 드로우 시 아이콘 하단 텍스트 배치
6. active 상태 시 아이콘만 색상 변경 (폰트 색상 유지)

### Phase 3: Header 개선
1. Tabler 아이콘 전면 적용
2. 다크모드/라이트모드/고대비 모드별 아이콘 적용
3. ui-component 적극 활용

### Phase 4: 테마 커스터마이징 시스템
1. 기본 컬러 변경 가능한 구조화
2. Shape (border-radius) 변경 가능한 구조화
3. 테마 변경 UI 생성

---

## 📐 개선 상세 계획

### 1. TokenProvider 개선

#### 1.1 localStorage 연동
```typescript
// 저장할 데이터 구조
interface ThemeConfig {
  theme: 'light' | 'dark';
  contrast: 'standard' | 'high';
  presetColor: string;
  borderRadius: number;
  customColors?: {
    primary?: string;
    secondary?: string;
  };
  sidebar: {
    miniDrawer: boolean;
    pinned: boolean;
  };
}
```

#### 1.2 테마 프리셋 시스템
- 기본 프리셋: default, monotone, theme1-7
- 사용자 커스텀 프리셋 저장
- 프리셋 전환 기능

#### 1.3 색상/모양 커스터마이징
- CSS 변수 동적 업데이트
- borderRadius 범위: 0-16px
- 색상 HSL 기반 조정

### 2. Sidebar 개선

#### 2.1 미니 드로우 모드
- 너비: 기본 280px → 미니 72px
- 애니메이션: transition 0.3s ease
- 상태 저장: localStorage

#### 2.2 호버 시 펼쳐짐
- 미니 모드일 때만 동작
- 호버 시 임시 확장 (280px)
- 고정핀 상태와 독립적

#### 2.3 고정핀 기능
- 우측 상단 핀 아이콘
- 고정 시 항상 확장 상태 유지
- localStorage 저장

#### 2.4 ui-component 적용
- `<List>` 컴포넌트로 메뉴 구조화
- `<ListItem>`, `<ListItemText>` 사용
- `<IconButton>` 사용

#### 2.5 미니 드로우 레이아웃
- 아이콘 중앙 정렬
- 텍스트 아이콘 하단 배치
- 세로 방향 스택

#### 2.6 active 상태 스타일
- 아이콘 색상만 변경
- 폰트 색상은 기본 유지
- 배경색으로 active 표시

### 3. Header 개선

#### 3.1 Tabler 아이콘 적용
- `IconMoon`, `IconSun` (테마 토글)
- `IconEye`, `IconEyeOff` (고대비 토글)
- `IconWifi`, `IconWifiOff` (연결 상태)
- `IconSettings` (설정 메뉴)

#### 3.2 모드별 아이콘
- 라이트 모드: 밝은 색상 아이콘
- 다크 모드: 어두운 색상 아이콘
- 고대비 모드: 강한 대비 아이콘

#### 3.3 ui-component 적용
- `<IconButton>` 사용
- `<Badge>` (연결 상태 표시)
- `<Flex>`, `<Stack>` 레이아웃

### 4. 테마 커스터마이징 UI

#### 4.1 테마 설정 패널
- 위치: Header 우측 설정 아이콘 클릭 시 드로어
- 구성:
  - 테마 모드 선택 (라이트/다크)
  - 고대비 모드 토글
  - 프리셋 선택
  - 색상 커스터마이징
  - Border Radius 슬라이더
  - Sidebar 설정

#### 4.2 색상 커스터마이징
- Primary 색상 선택기
- Secondary 색상 선택기
- HSL 슬라이더

#### 4.3 Shape 커스터마이징
- Border Radius 슬라이더 (0-16px)
- 실시간 미리보기

---

## 🔧 기술 구현 세부사항

### 1. TokenProvider 확장

```typescript
interface ExtendedTokenContextType extends TokenContextType {
  // 테마 프리셋
  presetColor: string;
  setPresetColor: (preset: string) => void;
  
  // 색상 커스터마이징
  customColors: {
    primary?: string;
    secondary?: string;
  };
  setCustomColor: (type: 'primary' | 'secondary', color: string) => void;
  
  // Shape 커스터마이징
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  
  // Sidebar 설정
  sidebarConfig: {
    miniDrawer: boolean;
    pinned: boolean;
  };
  setSidebarConfig: (config: Partial<SidebarConfig>) => void;
  
  // 초기값 복원
  resetToDefaults: () => void;
}
```

### 2. CSS 변수 동적 업데이트

```typescript
// TokenProvider 내부
useEffect(() => {
  const root = document.documentElement;
  
  // 커스텀 색상 적용
  if (customColors.primary) {
    root.style.setProperty('--color-interactive-primary', customColors.primary);
  }
  
  // Border Radius 적용
  root.style.setProperty('--primitive-radius-md', `${borderRadius}px`);
}, [customColors, borderRadius]);
```

### 3. Sidebar 상태 관리

```typescript
interface SidebarState {
  isMini: boolean;
  isPinned: boolean;
  isHovered: boolean;
  isExpanded: boolean; // 실제 표시 너비
}

// 계산 로직
const isExpanded = isPinned || (!isMini && !isPinned) || (isMini && isHovered);
```

### 4. 테마 프리셋 시스템

```typescript
const themePresets = {
  default: { /* 기본 색상 */ },
  monotone: { /* monotone 색상 */ },
  theme1: { /* theme1 색상 */ },
  // ...
};

// 프리셋 적용
const applyPreset = (presetName: string) => {
  const preset = themePresets[presetName];
  // CSS 변수 업데이트
};
```

---

## 📅 구현 순서

1. **TokenProvider 개선** (기반 구조)
   - localStorage 연동
   - 확장된 인터페이스
   - CSS 변수 동적 업데이트

2. **Sidebar 개선**
   - 미니 드로우 모드
   - 호버/고정핀 기능
   - ui-component 적용
   - 스타일 개선

3. **Header 개선**
   - Tabler 아이콘 적용
   - ui-component 적용

4. **테마 커스터마이징 UI**
   - 설정 드로어 생성
   - 색상/Shape 커스터마이징
   - 프리셋 선택 UI

---

## ✅ 체크리스트

### Phase 1: TokenProvider
- [ ] localStorage 저장/로드 기능
- [ ] 테마 프리셋 시스템
- [ ] 색상 커스터마이징
- [ ] Shape 커스터마이징
- [ ] 초기값 복원 기능

### Phase 2: Sidebar
- [ ] 미니 드로우 모드
- [ ] 호버 시 펼쳐짐
- [ ] 고정핀 기능
- [ ] ui-component 적용
- [ ] 미니 드로우 레이아웃
- [ ] active 상태 스타일 수정

### Phase 3: Header
- [ ] Tabler 아이콘 적용
- [ ] 모드별 아이콘 색상
- [ ] ui-component 적용

### Phase 4: 테마 UI
- [ ] 설정 드로어 생성
- [ ] 색상 선택기
- [ ] Border Radius 슬라이더
- [ ] 프리셋 선택 UI
- [ ] 실시간 미리보기

---

## 📝 참고사항

- 참고 파일: `c:\Users\WONJAE\Desktop\새 폴더\` 내 디자인 파일들
- 디자인 토큰 시스템 3단계 계층 구조 유지
- SCSS 및 BEM 네이밍 규칙 준수
- MUI 7 버전 이상 문법 (현재는 Preact 사용 중)
- 반응형 디자인 고려







