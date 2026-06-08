import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Catch and suppress benign Vite WebSocket/HMR errors in the sandboxed dev environment
if (typeof window !== 'undefined') {
  const isBenignWebsocketError = (err: any): boolean => {
    if (!err) return false;
    const errStr = String(err.message || err.reason || err);
    return (
      errStr.toLowerCase().includes('websocket') || 
      errStr.toLowerCase().includes('web socket') ||
      errStr.includes('WebSocket closed without opened')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignWebsocketError(event.reason) || isBenignWebsocketError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isBenignWebsocketError(event.error) || isBenignWebsocketError(event.message) || isBenignWebsocketError(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

