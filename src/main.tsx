import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

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

