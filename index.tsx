import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { ErrorBoundary } from './components/common';
import { logError } from './services/firebase';

// 未ハンドルのPromise rejectionをグローバルでキャッチ
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const detail = reason instanceof Error
    ? `${reason.name}: ${reason.message}`
    : String(reason);
  console.error('[Unhandled Rejection]', reason);
  logError(null, 'unhandled_rejection', detail);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ClientProvider>
          <App />
        </ClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
