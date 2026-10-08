import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Safeguard against third-party browser extension errors (MetaMask, Web3 wallet injected scripts)
if (typeof window !== 'undefined') {
  const isExtensionError = (msg?: string, source?: string) => {
    const text = (msg || '') + ' ' + (source || '');
    return (
      text.includes('chrome-extension://') ||
      text.includes('moz-extension://') ||
      text.includes('MetaMask') ||
      text.includes('metamask') ||
      text.includes('Failed to connect to MetaMask') ||
      text.includes('ethereum')
    );
  };

  window.addEventListener('error', (event) => {
    if (isExtensionError(event.message, event.filename)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || event.reason?.stack || String(event.reason || '');
    if (isExtensionError(reasonMsg)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

// Clean up duplicate or legacy hash in the URL (e.g. /catalog#/catalog -> /catalog, /#/ -> /)
if (window.location.hash) {
  const hashPath = window.location.hash.replace(/^#\/?/, '/');
  if (hashPath && hashPath !== '/' && !window.location.pathname.startsWith(hashPath)) {
    window.history.replaceState(null, '', hashPath + window.location.search);
  } else {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

