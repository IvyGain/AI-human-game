import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PWAとiOS互換性の初期化
import { initializeIOSCompatibility } from './utils/iOSCompatibility';
import { pwaManager } from './utils/pwa';

// iOS互換性機能を初期化
initializeIOSCompatibility();

// PWAマネージャーは自動で初期化される
console.log('PWA Manager initialized:', pwaManager.getStatus());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);