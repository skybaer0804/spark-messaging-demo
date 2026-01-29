import { useState } from 'preact/hooks';
import { useTheme, PresetColor } from '@/core/context/ThemeProvider';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState'; // Use shared router state
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { Switch } from '@/ui-components/Switch/Switch';
import { Paper } from '@/ui-components/Paper/Paper';
import { Divider } from '@/ui-components/Divider/Divider';
import { Box } from '@/ui-components/Layout/Box';
import { Grid } from '@/ui-components/Layout/Grid';
import { IconPalette, IconShape, IconColorSwatch, IconLogout, IconArrowLeft } from '@tabler/icons-preact';
import './ThemePage.scss';

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

export function ThemePage() {
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
    navigate('/login');
  };

  return (
    <Box className="theme-page" style={{ height: '100%', overflowY: 'auto', padding: '24px', backgroundColor: 'var(--color-bg-default)' }}>
      <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <Stack spacing="lg" style={{ marginBottom: '32px' }}>
          <Flex align="center" gap="sm">
            <Button variant="text" onClick={() => navigate('/')} className="theme-page__back-btn">
              <IconArrowLeft size={24} />
            </Button>
            <Typography variant="h2">설정 및 테마</Typography>
          </Flex>
          <Typography variant="body-large" color="text-secondary">
            애플리케이션의 외관과 동작 방식을 나만의 스타일로 꾸며보세요.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {/* Left Column: Theme Settings */}
          <Grid item xs={12} md={8}>
            <Stack spacing="lg">
              
              {/* Color Theme Section */}
              <Paper elevation={1} padding="lg">
                <Stack spacing="md">
                  <Flex align="center" gap="sm">
                    <IconPalette size={20} />
                    <Typography variant="h4">테마 모드</Typography>
                  </Flex>
                  <Divider />
                  
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Typography variant="body-medium" style={{ fontWeight: 700 }}>다크 모드</Typography>
                      <Typography variant="caption" color="text-secondary">어두운 환경에서 눈의 피로를 줄여줍니다.</Typography>
                    </Box>
                    <Switch
                      checked={theme === 'dark'}
                      onChange={(checked) => checked !== (theme === 'dark') && toggleTheme()}
                    />
                  </Flex>
                  
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Typography variant="body-medium" style={{ fontWeight: 700 }}>고대비 모드</Typography>
                      <Typography variant="caption" color="text-secondary">텍스트와 요소의 구분을 명확하게 합니다.</Typography>
                    </Box>
                    <Switch
                      checked={contrast === 'high'}
                      onChange={(checked) => checked !== (contrast === 'high') && toggleContrast()}
                    />
                  </Flex>
                </Stack>
              </Paper>

              {/* Preset Colors */}
              <Paper elevation={1} padding="lg">
                <Stack spacing="md">
                  <Flex align="center" gap="sm">
                    <IconColorSwatch size={20} />
                    <Typography variant="h4">강조 색상</Typography>
                  </Flex>
                  <Divider />
                  <div className="theme-page__preset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.value}
                        style={{
                          padding: '8px',
                          border: `2px solid ${presetColor === preset.value ? 'var(--color-interactive-primary)' : 'var(--color-border-default)'}`,
                          borderRadius: 'var(--primitive-radius-md)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setPresetColor(preset.value)}
                      >
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          backgroundColor: preset.value === 'default' ? '#00A3FF' : preset.value === 'monotone' ? '#333' : `var(--color-preset-${preset.value}-primary, #888)` 
                        }} />
                        <Typography variant="caption">{preset.label}</Typography>
                      </button>
                    ))}
                  </div>
                </Stack>
              </Paper>

              {/* Radius & Layout */}
              <Paper elevation={1} padding="lg">
                <Stack spacing="md">
                  <Flex align="center" gap="sm">
                    <IconShape size={20} />
                    <Typography variant="h4">레이아웃 및 모양</Typography>
                  </Flex>
                  <Divider />

                  <Box>
                     <Flex align="center" justify="space-between" style={{ marginBottom: '8px' }}>
                      <Typography variant="body-medium" style={{ fontWeight: 700 }}>모서리 둥글기</Typography>
                      <Typography variant="body-small">{localBorderRadius}px</Typography>
                    </Flex>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={localBorderRadius}
                      onInput={(e) => handleBorderRadiusChange(Number((e.target as HTMLInputElement).value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      backgroundColor: 'var(--color-interactive-primary)', 
                      color: 'white',
                      borderRadius: `${localBorderRadius}px`,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body-small">버튼 모양 미리보기</Typography>
                    </div>
                  </Box>

                   <Stack spacing="sm" style={{ marginTop: '16px' }}>
                    <Typography variant="body-medium" style={{ fontWeight: 700 }}>사이드바 설정</Typography>
                    <Flex align="center" justify="space-between">
                      <Typography variant="body-small">미니 드로우 모드 (아이콘만 표시)</Typography>
                      <Switch
                        checked={sidebarConfig.miniDrawer}
                        onChange={(checked) => setSidebarConfig({ miniDrawer: checked })}
                      />
                    </Flex>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column: Account & Reset */}
          <Grid item xs={12} md={4}>
             <Stack spacing="lg">
              <Paper elevation={1} padding="lg">
                 <Stack spacing="md">
                  <Typography variant="h4">계정</Typography>
                  <Divider />
                  {isAuthenticated && (
                     <Button variant="secondary" fullWidth onClick={handleLogout} style={{ color: 'var(--color-status-error)' }}>
                      <Flex align="center" justify="center" gap="sm">
                        <IconLogout size={18} />
                        <Typography variant="body-small">로그아웃</Typography>
                      </Flex>
                    </Button>
                  )}
                 </Stack>
              </Paper>

              <Paper elevation={1} padding="lg">
                 <Stack spacing="md">
                  <Typography variant="h4">초기화</Typography>
                  <Divider />
                  <Typography variant="body-small" color="text-secondary">
                    모든 테마 설정을 기본값으로 되돌립니다.
                  </Typography>
                  <Button variant="secondary" fullWidth onClick={resetToDefaults}>
                    기본값으로 복원
                  </Button>
                 </Stack>
              </Paper>
             </Stack>
          </Grid>
        </Grid>

      </Box>
    </Box>
  );
}
