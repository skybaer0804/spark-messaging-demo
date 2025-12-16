export interface DesignSystemExampleDefinition {
  /** route id: `/design-system/:ui`의 :ui와 동일 */
  id: string;
  /** 좌측/사이드바에 보이는 라벨 */
  label: string;
  /** 간단 설명(의도/사용 상황) */
  description: string;
  /** 예시 렌더링 컴포넌트 */
  Example: () => preact.JSX.Element;
  /** 사용법 코드 스니펫(문서/복사용) */
  usageCode: string;
}


