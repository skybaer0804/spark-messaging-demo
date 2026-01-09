import { useState } from 'preact/hooks';
import { useTheme, PresetColor } from '@/core/context/ThemeProvider';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { Drawer } from '@/ui-components/Drawer/Drawer';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { Switch } from '@/ui-components/Switch/Switch';
import { Paper } from '@/ui-components/Paper/Paper';
import { Divider } from '@/ui-components/Divider/Divider';
import { IconPalette, IconShape, IconColorSwatch, IconLogout } from '@tabler/icons-preact';
import './ThemeCustomization.scss';

interface ThemeCustomizationProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS: { value: PresetColor; label: string }[] = [
  { value: 'default', label: '기본' },
  { value: 'monotone', label: '모노톤' },
  { value: 'theme1', label: '테마 1' },
  { value: 'theme2', label: '테마 2' },
  { value: 'theme3', label: '테마 3' },
  { value: 'theme4', label: '테마 4' },
  { value: 'theme5', label: '테마 5' },
  { value: 'theme6', label: '테마 6' },
  { value: 'theme7', label: '테마 7' },
];

export function ThemeCustomization({ open, onClose }: ThemeCustomizationProps) {
  const {
    theme,
    toggleTheme,
    contrast,
    toggleContrast,
    presetColor,
    setPresetColor,
    borderRadius,
    setBorderRadius,
    sidebarConfig,
    setSidebarConfig,
    resetToDefaults,
    deviceSize,
  } = useTheme();

  const { signOut, isAuthenticated } = useAuth();
  const { navigate } = useRouterState();

  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius);

  const handleBorderRadiusChange = (value: number) => {
    setLocalBorderRadius(value);
    setBorderRadius(value);
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  const isMobile = deviceSize === 'mobile';
  const drawerWidth = isMobile ? '85vw' : '400px';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      title="테마 및 계정 설정"
      width={drawerWidth}
      className="theme-customization__drawer"
    >
      <Stack spacing="lg">
        {/* 테마 모드 */}
        <Paper elevation={2} padding="md">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconPalette size={18} />
              <Typography variant="body-large">테마 모드</Typography>
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography variant="body-small">다크 모드</Typography>
              <Switch
                checked={theme === 'dark'}
                onChange={(checked) => checked !== (theme === 'dark') && toggleTheme()}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography variant="body-small">고대비 모드</Typography>
              <Switch
                checked={contrast === 'high'}
                onChange={(checked) => checked !== (contrast === 'high') && toggleContrast()}
              />
            </Flex>
          </Stack>
        </Paper>

        {/* 계정 설정 (로그아웃) */}
        {isAuthenticated && (
          <Paper elevation={2} padding="md">
            <Stack spacing="md">
              <Typography variant="body-large">계정 설정</Typography>
              <Divider />
              <Button variant="secondary" fullWidth onClick={handleLogout} className="theme-customization__logout-btn">
                <Flex align="center" justify="center" gap="sm">
                  <IconLogout size={18} />
                  <Typography variant="body-small">로그아웃</Typography>
                </Flex>
              </Button>
            </Stack>
          </Paper>
        )}

        {/* 프리셋 색상 */}
        <Paper elevation={2} padding="md">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconColorSwatch size={18} />
              <Typography variant="body-large">프리셋 색상</Typography>
            </Flex>
            <div className="theme-customization__preset-grid">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  className={`theme-customization__preset-button ${
                    presetColor === preset.value ? 'theme-customization__preset-button--active' : ''
                  }`}
                  onClick={() => setPresetColor(preset.value)}
                >
                  <Typography variant="caption">{preset.label}</Typography>
                </button>
              ))}
            </div>
          </Stack>
        </Paper>

        {/* Border Radius */}
        <Paper elevation={2} padding="md">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconShape size={18} />
              <Typography variant="body-large">모서리 둥글기</Typography>
            </Flex>
            <div className="theme-customization__slider-container">
              <input
                type="range"
                min="0"
                max="16"
                value={localBorderRadius}
                onInput={(e) => handleBorderRadiusChange(Number((e.target as HTMLInputElement).value))}
                className="theme-customization__slider"
              />
              <Flex align="center" justify="space-between">
                <Typography variant="caption">0px</Typography>
                <Typography variant="body-small" className="theme-customization__slider-value">
                  {localBorderRadius}px
                </Typography>
                <Typography variant="caption">16px</Typography>
              </Flex>
            </div>
            <div className="theme-customization__preview" style={{ borderRadius: `${localBorderRadius}px` }}>
              <Typography variant="caption">미리보기</Typography>
            </div>
          </Stack>
        </Paper>

        {/* Sidebar 설정 */}
        <Paper elevation={2} padding="md">
          <Stack spacing="md">
            <Typography variant="body-large">사이드바 설정</Typography>
            <Flex align="center" justify="space-between">
              <Typography variant="body-small">미니 드로우</Typography>
              <Switch
                checked={sidebarConfig.miniDrawer}
                onChange={(checked) => setSidebarConfig({ miniDrawer: checked })}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Typography variant="body-small">고정</Typography>
              <Switch checked={sidebarConfig.pinned} onChange={(checked) => setSidebarConfig({ pinned: checked })} />
            </Flex>
          </Stack>
        </Paper>

        {/* 초기화 */}
        <Button variant="secondary" fullWidth onClick={resetToDefaults}>
          <Typography variant="body-small">기본값으로 복원</Typography>
        </Button>
      </Stack>
    </Drawer>
  );
}
