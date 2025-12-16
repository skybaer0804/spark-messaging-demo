import { useState } from 'preact/hooks';
import { BottomNavigation } from '@/ui-component/BottomNavigation/BottomNavigation';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Stack } from '@/ui-component/Layout/Stack';
import { IconHome, IconSearch, IconUser } from '@tabler/icons-react';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `import { BottomNavigation } from '@/ui-component/BottomNavigation/BottomNavigation';

<BottomNavigation
  value={value}
  onChange={(next) => setValue(next)}
  items={[{ value: 'home', label: 'Home' }] }
/>
`;

export const bottomNavigationExample: DesignSystemExampleDefinition = {
  id: 'bottom-navigation',
  label: 'BottomNavigation',
  description: '모바일/하단 네비게이션에 적합한 컴포넌트입니다.',
  usageCode,
  Example: () => {
    const [value, setValue] = useState<string | number>('home');
    return (
      <Stack spacing="sm">
        <Typography variant="body-small" color="text-secondary">
          선택: {String(value)}
        </Typography>
        <Paper padding="none" variant="outlined">
          <BottomNavigation
            ariaLabel="bottom navigation example"
            position="static"
            value={value}
            onChange={(next) => setValue(next)}
            items={[
              { value: 'home', label: 'Home', icon: <IconHome size={20} /> },
              { value: 'search', label: 'Search', icon: <IconSearch size={20} /> },
              { value: 'profile', label: 'Profile', icon: <IconUser size={20} /> },
            ]}
          />
        </Paper>
      </Stack>
    );
  },
};


