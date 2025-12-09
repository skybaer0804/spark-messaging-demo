import { render } from 'preact';
import { App } from './app';
import { TokenProvider } from './context/TokenProvider';
import './index.css';

render(
  <TokenProvider>
    <App />
  </TokenProvider>,
  document.getElementById('app')!,
);
