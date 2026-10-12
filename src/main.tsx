import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
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
      return;
    }
    // Prevent blank screen if a fatal runtime error prevents mounting
    const root = document.getElementById('root');
    if (root && (!root.innerHTML || root.innerHTML.trim() === '')) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: white; font-family: sans-serif; padding: 20px; text-align: center;">
          <div style="max-width: 440px; background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #f8fafc;">Premier Library Portal</h2>
            <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px 0;">${event.message || 'Loading error. Click below to reload.'}</p>
            <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: bold; cursor: pointer;">Reload Portal</button>
          </div>
        </div>
      `;
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

// Clean up duplicate or legacy hash in the URL safely
try {
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashPath = window.location.hash.replace(/^#\/?/, '/');
    if (hashPath && hashPath !== '/' && !window.location.pathname.startsWith(hashPath)) {
      window.history.replaceState(null, '', hashPath + window.location.search);
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
} catch {
  // Avoid crashing if running in sandboxed or cross-origin iframe
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: white; font-family: sans-serif; padding: 20px; text-align: center;">
        <div style="max-width: 420px; background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #f8fafc;">Premier Library Portal</h2>
          <p style="font-size: 13px; color: #94a3b8; margin: 0 0 16px 0;">An initialization error occurred. Click reload to refresh the portal.</p>
          <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: bold; cursor: pointer;">Reload Portal</button>
        </div>
      </div>
    `;
  }
}

