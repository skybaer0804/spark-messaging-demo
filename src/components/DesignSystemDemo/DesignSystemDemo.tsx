import { useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import { Button } from '@/ui-component/Button/Button';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Input } from '@/ui-component/Input/Input';
import { TextField } from '@/ui-component/TextField/TextField';
import { Select } from '@/ui-component/Select/Select';
import { StatusChip } from '@/ui-component/StatusChip/StatusChip';
import { Card, CardHeader, CardBody, CardFooter } from '@/ui-component/Card/Card';
import { Box } from '@/ui-component/Layout/Box';
import { Flex } from '@/ui-component/Layout/Flex';
import { Grid } from '@/ui-component/Layout/Grid';
import { Stack } from '@/ui-component/Layout/Stack';
import { Container } from '@/ui-component/Layout/Container';
import { Typography } from '@/ui-component/Typography/Typography';
import { Paper } from '@/ui-component/Paper/Paper';
import { Avatar } from '@/ui-component/Avatar/Avatar';
import { Badge } from '@/ui-component/Badge/Badge';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-component/List/List';
import { Divider } from '@/ui-component/Divider/Divider';
import { Switch } from '@/ui-component/Switch/Switch';
import { Checkbox } from '@/ui-component/Checkbox/Checkbox';
import { Radio } from '@/ui-component/Radio/Radio';
import { Alert } from '@/ui-component/Alert/Alert';
import { CircularProgress } from '@/ui-component/CircularProgress/CircularProgress';
import { Skeleton } from '@/ui-component/Skeleton/Skeleton';
import { Tabs } from '@/ui-component/Tabs/Tabs';
import { Stepper } from '@/ui-component/Stepper/Stepper';
import { SpeedDial } from '@/ui-component/SpeedDial/SpeedDial';
import { Pagination } from '@/ui-component/Pagination/Pagination';
import { Breadcrumbs } from '@/ui-component/Breadcrumbs/Breadcrumbs';
import { BottomNavigation } from '@/ui-component/BottomNavigation/BottomNavigation';
import { Accordion } from '@/ui-component/Accordion/Accordion';
import { ButtonGroup } from '@/ui-component/ButtonGroup/ButtonGroup';
import { IconHome, IconUser, IconSettings, IconBell, IconSearch, IconTrash, IconMail, IconPlus, IconX } from '@tabler/icons-react';
import './DesignSystemDemo.scss';

export function DesignSystemDemo() {
  const { theme, toggleTheme, contrast, toggleContrast } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('option1');
  const [tabValue, setTabValue] = useState<string | number>('overview');
  const [activeStep, setActiveStep] = useState(1);
  const [page, setPage] = useState(3);
  const [bottomNavValue, setBottomNavValue] = useState<string | number>('home');

  return (
    <div
      className="design-system-demo"
      style={{ backgroundColor: 'var(--color-background-default)', minHeight: '100vh', paddingBottom: '40px' }}
    >
      <Paper
        square
        elevation={1}
        padding="md"
        style={{ position: 'sticky', top: 0, zIndex: 1000, marginBottom: '24px' }}
      >
        <Container maxWidth="xl">
          <Flex justify="space-between" align="center">
            <Typography variant="h2">KRDS Design System</Typography>
            <Stack direction="row" spacing="sm">
              <Button onClick={toggleTheme} variant="secondary" size="sm">
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </Button>
              <Button onClick={toggleContrast} variant="secondary" size="sm">
                {contrast === 'standard' ? '👁️ High Contrast' : '👁️ Standard'}
              </Button>
            </Stack>
          </Flex>
        </Container>
      </Paper>

      <Container maxWidth="lg">
        <Stack spacing="lg">
          {/* Typography */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Typography
            </Typography>
            <Stack spacing="sm">
              <Typography variant="display-large">Display Large</Typography>
              <Typography variant="h1">Heading 1</Typography>
              <Typography variant="h2">Heading 2</Typography>
              <Typography variant="h3">Heading 3</Typography>
              <Divider />
              <Typography variant="body-large">
                Body Large - 본문 텍스트입니다 using the design system tokens.
              </Typography>
              <Typography variant="body-medium">Body Medium - 본문 텍스트입니다. Default body text size.</Typography>
              <Typography variant="body-small">Body Small - 작은 본문 텍스트입니다.</Typography>
              <Typography variant="caption" color="text-secondary">
                Caption - 캡션 텍스트입니다.
              </Typography>
            </Stack>
          </Paper>

          {/* Data Display */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Data Display
            </Typography>
            <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="lg">
              {/* Avatars */}
              <Box>
                <Typography variant="h3" style={{ marginBottom: '12px' }}>
                  Avatars
                </Typography>
                <Stack direction="row" spacing="md" align="center">
                  <Avatar size="xl" src="https://i.pravatar.cc/150?img=1" alt="User 1" />
                  <Avatar size="lg" src="https://i.pravatar.cc/150?img=2" alt="User 2" />
                  <Avatar size="md">H</Avatar>
                  <Avatar size="sm" variant="rounded" style={{ backgroundColor: 'var(--primitive-primary-500)' }}>
                    OP
                  </Avatar>
                </Stack>
              </Box>

              {/* Badges */}
              <Box>
                <Typography variant="h3" style={{ marginBottom: '12px' }}>
                  Badges
                </Typography>
                <Stack direction="row" spacing="lg" align="center">
                  <Badge badgeContent={4} color="error">
                    <IconMail size={24} />
                  </Badge>
                  <Badge badgeContent={100} color="primary">
                    <IconMail size={24} />
                  </Badge>
                  <Badge variant="dot" color="success">
                    <IconBell size={24} />
                  </Badge>
                </Stack>
              </Box>

              {/* Lists */}
              <Box>
                <Typography variant="h3" style={{ marginBottom: '12px' }}>
                  Lists
                </Typography>
                <Paper variant="outlined" padding="none">
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <IconUser />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary="User Name" secondary="Software Engineer" />
                    </ListItem>
                    <Divider variant="inset" />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar style={{ backgroundColor: 'var(--primitive-secondary-500)' }}>
                          <IconSettings />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary="Settings" secondary="Account configuration" />
                    </ListItem>
                  </List>
                </Paper>
              </Box>
            </Grid>
          </Paper>

          {/* Inputs & Buttons */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Inputs & Buttons
            </Typography>
            <Grid columns={2} gap="xl">
              <Stack spacing="md">
                <Typography variant="h3">Buttons</Typography>
                <Flex gap="sm" wrap="wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button disabled>Disabled</Button>
                  <IconButton color="primary">
                    <IconSearch />
                  </IconButton>
                  <IconButton color="error">
                    <IconTrash />
                  </IconButton>
                </Flex>
                <Typography variant="h3">Button Group</Typography>
                <Stack spacing="sm">
                  <ButtonGroup>
                    <Button variant="secondary">Left</Button>
                    <Button variant="secondary">Center</Button>
                    <Button variant="secondary">Right</Button>
                  </ButtonGroup>
                  <ButtonGroup orientation="vertical" fullWidth>
                    <Button variant="secondary" fullWidth>
                      One
                    </Button>
                    <Button variant="secondary" fullWidth>
                      Two
                    </Button>
                    <Button variant="secondary" fullWidth disabled>
                      Disabled
                    </Button>
                  </ButtonGroup>
                </Stack>
              </Stack>

              <Stack spacing="md">
                <Typography variant="h3">Inputs</Typography>
                <Input
                  label="Email (Input)"
                  placeholder="user@example.com"
                  fullWidth
                  value={inputValue}
                  onInput={(e) => setInputValue(e.currentTarget.value)}
                />
                <TextField label="Standard TextField" variant="standard" placeholder="Standard variant" fullWidth />
                <TextField label="Filled TextField" variant="filled" placeholder="Filled variant" fullWidth />
                <Select
                  label="Role"
                  options={[
                    { label: 'Admin', value: 'admin' },
                    { label: 'User', value: 'user' },
                  ]}
                  fullWidth
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.currentTarget.value)}
                />
              </Stack>
            </Grid>
          </Paper>

          {/* Surfaces */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Surfaces
            </Typography>
            <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="lg">
              <Card>
                <CardHeader>
                  <Typography variant="h3">Card Title</Typography>
                </CardHeader>
                <CardBody>
                  <Typography variant="body-medium">
                    This is a card component used to display content. It can contain text, images, and actions.
                  </Typography>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Paper variant="outlined" padding="lg">
                <Typography variant="h3" style={{ marginBottom: '8px' }}>
                  Outlined Paper
                </Typography>
                <Typography variant="body-medium">
                  Paper component can be used as a generic container with different elevation levels or outlined style.
                </Typography>
              </Paper>
            </Grid>
          </Paper>

          {/* Data Display Extra (Status Chips) */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Status & Feedback
            </Typography>
            <Stack spacing="md">
              <Typography variant="h3">Status Chips</Typography>
              <Flex gap="md">
                <StatusChip variant="active" label="Active" />
                <StatusChip variant="pending" label="Pending" />
                <StatusChip variant="badge" label="Badge" />
                <StatusChip variant="default" label="Default" />
              </Flex>
            </Stack>
          </Paper>

          {/* Layout */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Layout
            </Typography>
            <Stack spacing="md">
              <Typography variant="body-medium">Grid Layout (12 cols)</Typography>
              <Grid columns={12} spacing="sm" rowSpacing="sm" columnSpacing="sm">
                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 8', textAlign: 'center' }}>
                  xs=8
                </Box>
                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
                  xs=4
                </Box>
                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 4', textAlign: 'center' }}>
                  xs=4
                </Box>
                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 8', textAlign: 'center' }}>
                  xs=8
                </Box>
              </Grid>
            </Stack>
          </Paper>

          {/* Navigation */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Navigation
            </Typography>
            <Box style={{ marginBottom: '16px' }}>
              <Accordion
                ariaLabel="design system accordion demo"
                allowMultiple
                defaultExpanded={['panel-1']}
                items={[
                  {
                    value: 'panel-1',
                    summary: 'Accordion 1',
                    details: <Typography variant="body-medium">첫 번째 패널 내용입니다.</Typography>,
                  },
                  {
                    value: 'panel-2',
                    summary: 'Accordion 2',
                    details: <Typography variant="body-medium">두 번째 패널 내용입니다.</Typography>,
                  },
                  {
                    value: 'panel-3',
                    summary: 'Disabled',
                    disabled: true,
                    details: <Typography variant="body-medium">비활성화된 패널입니다.</Typography>,
                  },
                ]}
              />
            </Box>
            <Breadcrumbs
              ariaLabel="design system breadcrumbs demo"
              maxItems={3}
              items={[
                { label: 'Home', onClick: () => {} },
                { label: 'Library', onClick: () => {} },
                { label: 'Data', onClick: () => {} },
                { label: 'Current Page' },
              ]}
            />
            <Tabs
              ariaLabel="design system tabs demo"
              value={tabValue}
              onChange={(next) => setTabValue(next)}
              items={[
                {
                  value: 'overview',
                  label: 'Overview',
                  content: (
                    <Typography variant="body-medium">
                      Overview content. Tabs는 키보드(←/→, Home/End) 이동과 ARIA 연결을 지원합니다.
                    </Typography>
                  ),
                },
                {
                  value: 'details',
                  label: 'Details',
                  content: (
                    <Stack spacing="sm">
                      <Typography variant="body-medium">Details content</Typography>
                      <Typography variant="caption" color="text-secondary">
                        토큰 기반 스타일로 어디서든 재사용 가능합니다.
                      </Typography>
                    </Stack>
                  ),
                },
                {
                  value: 'disabled',
                  label: 'Disabled',
                  disabled: true,
                  content: <Typography variant="body-medium">Disabled tab content</Typography>,
                },
              ]}
            />
            <Box style={{ marginTop: '16px' }}>
              <Stepper
                ariaLabel="design system stepper demo"
                nonLinear
                activeStep={activeStep}
                onChange={(next) => setActiveStep(next)}
                steps={[
                  {
                    label: '계정',
                    description: '프로필 설정',
                    content: <Typography variant="body-medium">Step 1 content</Typography>,
                  },
                  {
                    label: '인증',
                    description: '보안 확인',
                    content: <Typography variant="body-medium">Step 2 content</Typography>,
                  },
                  {
                    label: '완료',
                    description: '설정 저장',
                    content: <Typography variant="body-medium">Step 3 content</Typography>,
                  },
                ]}
                showContent
              />
            </Box>
            <Box style={{ marginTop: '16px' }}>
              <Pagination
                ariaLabel="design system pagination demo"
                count={24}
                page={page}
                onChange={(next) => setPage(next)}
                showFirstButton
                showLastButton
                siblingCount={1}
                boundaryCount={1}
                variant="outlined"
              />
            </Box>
          </Paper>

          {/* Surfaces */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Surfaces
            </Typography>
            <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="lg">
              <Card>
                <CardHeader>
                  <Typography variant="h3">Card Title</Typography>
                </CardHeader>
                <CardBody>
                  <Typography variant="body-medium">
                    This is a card component used to display content. It can contain text, images, and actions.
                  </Typography>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Paper variant="outlined" padding="lg">
                <Typography variant="h3" style={{ marginBottom: '8px' }}>
                  Outlined Paper
                </Typography>
                <Typography variant="body-medium">
                  Paper component can be used as a generic container with different elevation levels or outlined style.
                </Typography>
              </Paper>
            </Grid>
          </Paper>

          {/* Icons */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Icons
            </Typography>
            <Flex gap="lg" wrap="wrap">
              <Stack align="center" spacing="xs">
                <IconHome />
                <Typography variant="caption">Home</Typography>
              </Stack>
              <Stack align="center" spacing="xs">
                <IconUser />
                <Typography variant="caption">User</Typography>
              </Stack>
              <Stack align="center" spacing="xs">
                <IconSettings />
                <Typography variant="caption">Settings</Typography>
              </Stack>
              <Stack align="center" spacing="xs">
                <IconBell />
                <Typography variant="caption">Bell</Typography>
              </Stack>
            </Flex>
          </Paper>

          {/* Selection Controls */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Selection Controls
            </Typography>
            <Grid columns={3} gap="xl">
              <Stack spacing="md">
                <Typography variant="h3">Switch</Typography>
                <Flex gap="md" align="center">
                  <Switch defaultChecked />
                  <Switch />
                  <Switch disabled defaultChecked />
                  <Switch color="success" defaultChecked />
                </Flex>
              </Stack>
              <Stack spacing="md">
                <Typography variant="h3">Checkbox</Typography>
                <Flex gap="md" align="center">
                  <Checkbox defaultChecked />
                  <Checkbox />
                  <Checkbox disabled defaultChecked />
                  <Checkbox color="error" defaultChecked />
                </Flex>
              </Stack>
              <Stack spacing="md">
                <Typography variant="h3">Radio</Typography>
                <Flex gap="md" align="center">
                  <Radio name="radio-demo" value="1" defaultChecked />
                  <Radio name="radio-demo" value="2" />
                  <Radio name="radio-demo" value="3" disabled />
                  <Radio name="radio-demo-2" value="4" color="warning" defaultChecked />
                </Flex>
              </Stack>
            </Grid>
          </Paper>

          {/* Feedback */}
          <Paper padding="lg">
            <Typography variant="h2" style={{ marginBottom: '16px' }}>
              Feedback
            </Typography>
            <Stack spacing="lg">
              <Box>
                <Typography variant="h3" style={{ marginBottom: '12px' }}>
                  Alerts
                </Typography>
                <Stack spacing="sm">
                  <Alert severity="success" onClose={() => {}}>
                    This is a success alert — check it out!
                  </Alert>
                  <Alert severity="info" variant="outlined">
                    This is an info alert — check it out!
                  </Alert>
                  <Alert severity="warning" variant="filled">
                    This is a warning alert — check it out!
                  </Alert>
                  <Alert severity="error">This is an error alert — check it out!</Alert>
                </Stack>
              </Box>

              <Grid columns={2} gap="xl">
                <Box>
                  <Typography variant="h3" style={{ marginBottom: '12px' }}>
                    Circular Progress
                  </Typography>
                  <Flex gap="lg" align="center">
                    <CircularProgress />
                    <CircularProgress color="secondary" />
                    <CircularProgress variant="determinate" value={75} color="success" />
                  </Flex>
                </Box>
                <Box>
                  <Typography variant="h3" style={{ marginBottom: '12px' }}>
                    Skeleton
                  </Typography>
                  <Stack spacing="xs">
                    <Skeleton variant="text" width={210} />
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton variant="rectangular" width={210} height={60} />
                    <Skeleton variant="rounded" width={210} height={60} />
                  </Stack>
                </Box>
              </Grid>
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <BottomNavigation
        ariaLabel="design system bottom navigation demo"
        position="fixed"
        value={bottomNavValue}
        onChange={(next) => setBottomNavValue(next)}
        items={[
          { value: 'home', label: 'Home', icon: <IconHome size={20} /> },
          { value: 'search', label: 'Search', icon: <IconSearch size={20} /> },
          { value: 'profile', label: 'Profile', icon: <IconUser size={20} /> },
        ]}
      />

      <SpeedDial
        ariaLabel="speed dial demo"
        anchor="bottom-right"
        direction="up"
        icon={<IconPlus size={22} />}
        openIcon={<IconX size={22} />}
        showBackdrop
        actions={[
          { name: 'Search', icon: <IconSearch size={18} />, onClick: () => {} },
          { name: 'Notifications', icon: <IconBell size={18} />, onClick: () => {} },
          { name: 'Settings', icon: <IconSettings size={18} />, onClick: () => {} },
        ]}
      />
    </div>
  );
}
