import { render } from 'preact';
import { App } from './app';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeProvider';
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
