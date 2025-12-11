import { render } from 'preact';
import { App } from './app';
import { ThemeProvider } from './context/ThemeProvider';
import './index.css';

render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
  document.getElementById('app')!,
);
