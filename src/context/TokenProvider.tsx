import { createContext, ComponentChildren } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

export type Theme = 'light' | 'dark';
export type Contrast = 'standard' | 'high';

interface TokenContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  contrast: Contrast;
  setContrast: (contrast: Contrast) => void;
  toggleContrast: () => void;
  deviceSize: 'mobile' | 'pc';
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
  children: ComponentChildren;
  defaultTheme?: Theme;
  defaultContrast?: Contrast;
}

export function TokenProvider({ children, defaultTheme = 'light', defaultContrast = 'standard' }: TokenProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [contrast, setContrast] = useState<Contrast>(defaultContrast);
  const [deviceSize, setDeviceSize] = useState<'mobile' | 'pc'>('pc');

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const toggleContrast = () => setContrast((prev) => (prev === 'standard' ? 'high' : 'standard'));

  // 모드/테마에 따른 CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-contrast', contrast);

    // 하위 호환성 또는 CSS 선택자 편의를 위해 조합된 속성도 제공 가능하지만
    // 현재는 각각의 data attribute로 충분함
  }, [theme, contrast]);

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

  const value: TokenContextType = {
    theme,
    setTheme,
    toggleTheme,
    contrast,
    setContrast,
    toggleContrast,
    deviceSize,
  };

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export const useTokens = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within TokenProvider');
  }
  return context;
};
