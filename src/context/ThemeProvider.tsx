import { createContext, ComponentChildren } from 'preact';
import { useContext, useEffect, useState, useCallback } from 'preact/hooks';

export type Theme = 'light' | 'dark';
export type Contrast = 'standard' | 'high';
export type PresetColor =
  | 'default'
  | 'monotone'
  | 'theme1'
  | 'theme2'
  | 'theme3'
  | 'theme4'
  | 'theme5'
  | 'theme6'
  | 'theme7';

interface SidebarConfig {
  miniDrawer: boolean;
  pinned: boolean;
}

interface CustomColors {
  primary?: string;
  secondary?: string;
}

interface ThemeConfig {
  theme: Theme;
  contrast: Contrast;
  presetColor: PresetColor;
  borderRadius: number;
  customColors: CustomColors;
  sidebar: SidebarConfig;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
  toggleContrast: () => void;
  deviceSize: 'mobile' | 'pc';
  // 테마 프리셋
  presetColor: PresetColor;
  setPresetColor: (preset: PresetColor) => void;
  // 색상 커스터마이징
  customColors: CustomColors;
  setCustomColor: (type: 'primary' | 'secondary', color: string) => void;
  // Shape 커스터마이징
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  // Sidebar 설정
  sidebarConfig: SidebarConfig;
  setSidebarConfig: (config: Partial<SidebarConfig>) => void;
  // 초기값 복원
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ComponentChildren;
  defaultTheme?: Theme;
  defaultContrast?: Contrast;
}

const STORAGE_KEY = 'spark-theme-config';
const DEFAULT_CONFIG: ThemeConfig = {
  theme: 'light',
  contrast: 'standard',
  presetColor: 'default',
  borderRadius: 6,
  customColors: {},
  sidebar: {
    miniDrawer: false,
    pinned: false,
  },
};

function loadConfigFromStorage(): ThemeConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 기본값과 병합하여 누락된 키 보완
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load theme config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
}

function saveConfigToStorage(config: ThemeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save theme config to localStorage:', error);
  }
}

export function ThemeProvider({ children, defaultTheme = 'light', defaultContrast = 'standard' }: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const stored = loadConfigFromStorage();
    // props로 전달된 기본값이 있으면 우선 적용
    return {
      ...stored,
      theme: defaultTheme,
      contrast: defaultContrast,
    };
  });

  const [deviceSize, setDeviceSize] = useState<'mobile' | 'pc'>('pc');

  // Config 업데이트 및 저장
  const updateConfig = useCallback((updates: Partial<ThemeConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      saveConfigToStorage(newConfig);
      return newConfig;
    });
  }, []);

  // Theme 관리
  const setTheme = useCallback(
    (theme: Theme) => {
      updateConfig({ theme });
    },
    [updateConfig],
  );

  const toggleTheme = useCallback(() => {
    setConfig((prev) => {
      const newTheme: Theme = prev.theme === 'light' ? 'dark' : 'light';
      const newConfig: ThemeConfig = { ...prev, theme: newTheme };
      saveConfigToStorage(newConfig);
      return newConfig;
    });
  }, []);

  // Contrast 관리
  const setContrast = useCallback(
    (contrast: Contrast) => {
      updateConfig({ contrast });
    },
    [updateConfig],
  );

  const toggleContrast = useCallback(() => {
    setConfig((prev) => {
      const newContrast: Contrast = prev.contrast === 'standard' ? 'high' : 'standard';
      const newConfig: ThemeConfig = { ...prev, contrast: newContrast };
      saveConfigToStorage(newConfig);
      return newConfig;
    });
  }, []);

  // Preset Color 관리
  const setPresetColor = useCallback(
    (presetColor: PresetColor) => {
      updateConfig({ presetColor });
    },
    [updateConfig],
  );

  // Custom Colors 관리
  const setCustomColor = useCallback((type: 'primary' | 'secondary', color: string) => {
    setConfig((prev) => {
      const newCustomColors = { ...prev.customColors, [type]: color };
      const newConfig = { ...prev, customColors: newCustomColors };
      saveConfigToStorage(newConfig);
      return newConfig;
    });
  }, []);

  // Border Radius 관리
  const setBorderRadius = useCallback(
    (borderRadius: number) => {
      updateConfig({ borderRadius });
    },
    [updateConfig],
  );

  // Sidebar Config 관리
  const setSidebarConfig = useCallback((updates: Partial<SidebarConfig>) => {
    setConfig((prev) => {
      const newSidebar = { ...prev.sidebar, ...updates };
      const newConfig = { ...prev, sidebar: newSidebar };
      saveConfigToStorage(newConfig);
      return newConfig;
    });
  }, []);

  // 초기값 복원
  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    saveConfigToStorage(DEFAULT_CONFIG);
  }, []);

  // 모드/테마에 따른 CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', config.theme);
    root.setAttribute('data-contrast', config.contrast);
    root.setAttribute('data-preset-color', config.presetColor);

    // 커스텀 색상 적용
    if (config.customColors.primary) {
      root.style.setProperty('--color-interactive-primary', config.customColors.primary);
    } else {
      root.style.removeProperty('--color-interactive-primary');
    }

    if (config.customColors.secondary) {
      root.style.setProperty('--color-interactive-secondary', config.customColors.secondary);
    } else {
      root.style.removeProperty('--color-interactive-secondary');
    }

    // Border Radius 적용
    root.style.setProperty('--primitive-radius-md', `${config.borderRadius}px`);
    root.style.setProperty('--primitive-radius-medium', `${config.borderRadius}px`);
  }, [config]);

  // 반응형 기기 감지
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDeviceSize(width < 768 ? 'mobile' : 'pc');
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기값 설정

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value: ThemeContextType = {
    theme: config.theme,
    setTheme,
    toggleTheme,
    contrast: config.contrast,
    setContrast,
    toggleContrast,
    deviceSize,
    presetColor: config.presetColor,
    setPresetColor,
    customColors: config.customColors,
    setCustomColor,
    borderRadius: config.borderRadius,
    setBorderRadius,
    sidebarConfig: config.sidebar,
    setSidebarConfig,
    resetToDefaults,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

