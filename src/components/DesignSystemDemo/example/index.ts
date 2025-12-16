import type { DesignSystemExampleDefinition } from './types';
import { overviewExample } from './OverviewExample';
import { typographyExample } from './TypographyExample';
import { buttonExample } from './ButtonExample';
import { accordionExample } from './AccordionExample';
import { alertExample } from './AlertExample';
import { avatarExample } from './AvatarExample';
import { badgeExample } from './BadgeExample';
import { bottomNavigationExample } from './BottomNavigationExample';
import { breadcrumbsExample } from './BreadcrumbsExample';
import { buttonGroupExample } from './ButtonGroupExample';
import { cardExample } from './CardExample';
import { checkboxExample } from './CheckboxExample';
import { circularProgressExample } from './CircularProgressExample';

// NOTE: 예시 파일은 `src/components/DesignSystemDemo/example/` 아래에 ui-component별로 수동/정석 방식으로 추가합니다.
export const designSystemExamples: DesignSystemExampleDefinition[] = [
  overviewExample,
  typographyExample,
  buttonExample,
  buttonGroupExample,
  accordionExample,
  alertExample,
  avatarExample,
  badgeExample,
  breadcrumbsExample,
  bottomNavigationExample,
  cardExample,
  checkboxExample,
  circularProgressExample,
];

export const designSystemExampleMap = new Map(designSystemExamples.map((e) => [e.id, e] as const));

export function getDesignSystemExampleById(id: string) {
  return designSystemExampleMap.get(id);
}


