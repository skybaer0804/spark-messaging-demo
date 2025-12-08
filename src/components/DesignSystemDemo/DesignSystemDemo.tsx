import { useState } from 'preact/hooks';
import { useTokens } from '../../context/TokenProvider';
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
import { IconHome, IconUser, IconSettings, IconBell, IconSearch, IconTrash, IconMail } from '@tabler/icons-react';
import './DesignSystemDemo.scss';

export function DesignSystemDemo() {
    const { theme, toggleTheme, contrast, toggleContrast } = useTokens();
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('option1');

    return (
        <div className="design-system-demo" style={{ backgroundColor: 'var(--color-background-default)', minHeight: '100vh', paddingBottom: '40px' }}>
            <Paper square elevation={1} padding="md" style={{ position: 'sticky', top: 0, zIndex: 1000, marginBottom: '24px' }}>
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Typography</Typography>
                        <Stack spacing="sm">
                            <Typography variant="display-large">Display Large</Typography>
                            <Typography variant="h1">Heading 1</Typography>
                            <Typography variant="h2">Heading 2</Typography>
                            <Typography variant="h3">Heading 3</Typography>
                            <Divider />
                            <Typography variant="body-large">Body Large - 본문 텍스트입니다 using the design system tokens.</Typography>
                            <Typography variant="body-medium">Body Medium - 본문 텍스트입니다. Default body text size.</Typography>
                            <Typography variant="body-small">Body Small - 작은 본문 텍스트입니다.</Typography>
                            <Typography variant="caption" color="text-secondary">Caption - 캡션 텍스트입니다.</Typography>
                        </Stack>
                    </Paper>

                    {/* Data Display */}
                    <Paper padding="lg">
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Data Display</Typography>
                        <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap="lg">
                            {/* Avatars */}
                            <Box>
                                <Typography variant="h3" style={{ marginBottom: '12px' }}>Avatars</Typography>
                                <Stack direction="row" spacing="md" align="center">
                                    <Avatar size="xl" src="https://i.pravatar.cc/150?img=1" alt="User 1" />
                                    <Avatar size="lg" src="https://i.pravatar.cc/150?img=2" alt="User 2" />
                                    <Avatar size="md">H</Avatar>
                                    <Avatar size="sm" variant="rounded" style={{ backgroundColor: 'var(--primitive-primary-500)' }}>OP</Avatar>
                                </Stack>
                            </Box>

                            {/* Badges */}
                            <Box>
                                <Typography variant="h3" style={{ marginBottom: '12px' }}>Badges</Typography>
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
                                <Typography variant="h3" style={{ marginBottom: '12px' }}>Lists</Typography>
                                <Paper variant="outlined" padding="none">
                                    <List>
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar><IconUser /></Avatar>
                                            </ListItemAvatar>
                                            <ListItemText primary="User Name" secondary="Software Engineer" />
                                        </ListItem>
                                        <Divider variant="inset" />
                                        <ListItem>
                                            <ListItemAvatar>
                                                <Avatar style={{ backgroundColor: 'var(--primitive-secondary-500)' }}><IconSettings /></Avatar>
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Inputs & Buttons</Typography>
                        <Grid columns={2} gap="xl">
                            <Stack spacing="md">
                                <Typography variant="h3">Buttons</Typography>
                                <Flex gap="sm" wrap="wrap">
                                    <Button variant="primary">Primary</Button>
                                    <Button variant="secondary">Secondary</Button>
                                    <Button disabled>Disabled</Button>
                                    <IconButton color="primary"><IconSearch /></IconButton>
                                    <IconButton color="error"><IconTrash /></IconButton>
                                </Flex>
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
                                <TextField
                                    label="Standard TextField"
                                    variant="standard"
                                    placeholder="Standard variant"
                                    fullWidth
                                />
                                <TextField
                                    label="Filled TextField"
                                    variant="filled"
                                    placeholder="Filled variant"
                                    fullWidth
                                />
                                <Select
                                    label="Role"
                                    options={[
                                        { label: 'Admin', value: 'admin' },
                                        { label: 'User', value: 'user' }
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Surfaces</Typography>
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
                                <Typography variant="h3" style={{ marginBottom: '8px' }}>Outlined Paper</Typography>
                                <Typography variant="body-medium">
                                    Paper component can be used as a generic container with different elevation levels or outlined style.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Paper>

                    {/* Data Display Extra (Status Chips) */}
                    <Paper padding="lg">
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Status & Feedback</Typography>
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Layout</Typography>
                        <Stack spacing="md">
                            <Typography variant="body-medium">Grid Layout (12 cols)</Typography>
                            <Grid columns={12} gap="sm">
                                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 8', textAlign: 'center' }}>xs=8</Box>
                                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 4', textAlign: 'center' }}>xs=4</Box>
                                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 4', textAlign: 'center' }}>xs=4</Box>
                                <Box background="primary-100" padding="md" style={{ gridColumn: 'span 8', textAlign: 'center' }}>xs=8</Box>
                            </Grid>
                        </Stack>
                    </Paper>

                    {/* Surfaces */}
                    <Paper padding="lg">
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Surfaces</Typography>
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
                                <Typography variant="h3" style={{ marginBottom: '8px' }}>Outlined Paper</Typography>
                                <Typography variant="body-medium">
                                    Paper component can be used as a generic container with different elevation levels or outlined style.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Paper>

                    {/* Icons */}
                    <Paper padding="lg">
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Icons</Typography>
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Selection Controls</Typography>
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
                        <Typography variant="h2" style={{ marginBottom: '16px' }}>Feedback</Typography>
                        <Stack spacing="lg">
                            <Box>
                                <Typography variant="h3" style={{ marginBottom: '12px' }}>Alerts</Typography>
                                <Stack spacing="sm">
                                    <Alert severity="success" onClose={() => { }}>This is a success alert — check it out!</Alert>
                                    <Alert severity="info" variant="outlined">This is an info alert — check it out!</Alert>
                                    <Alert severity="warning" variant="filled">This is a warning alert — check it out!</Alert>
                                    <Alert severity="error">This is an error alert — check it out!</Alert>
                                </Stack>
                            </Box>

                            <Grid columns={2} gap="xl">
                                <Box>
                                    <Typography variant="h3" style={{ marginBottom: '12px' }}>Circular Progress</Typography>
                                    <Flex gap="lg" align="center">
                                        <CircularProgress />
                                        <CircularProgress color="secondary" />
                                        <CircularProgress variant="determinate" value={75} color="success" />
                                    </Flex>
                                </Box>
                                <Box>
                                    <Typography variant="h3" style={{ marginBottom: '12px' }}>Skeleton</Typography>
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
        </div>
    );
}



