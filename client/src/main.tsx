import { render } from 'preact';
import { App } from './app';
import { AuthProvider } from '@/core/context/AuthContext';
import { ToastProvider } from '@/core/context/ToastContext';
import { ThemeProvider } from '@/core/context/ThemeProvider';
import './index.css';

render(
  <ToastProvider>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </ToastProvider>,
  document.getElementById('app')!,
);
