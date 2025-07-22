import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import { APP_CONFIG } from './config/settings';

import './index.css';

// Enhanced theme detection and management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  let appliedTheme = 'light';
  
  if (savedTheme === 'dark' || savedTheme === 'light') {
    appliedTheme = savedTheme;
  } else if (savedTheme === 'system' || !savedTheme) {
    appliedTheme = systemTheme;
  }
  
  document.documentElement.classList.toggle('dark', appliedTheme === 'dark');
}

// System theme change listener
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function updateDarkClass(e = null) {
  const savedTheme = localStorage.getItem('theme');
  
  // Only update if user prefers system theme
  if (!savedTheme || savedTheme === 'system') {
    const isDark = e ? e.matches : darkQuery.matches;
    document.documentElement.classList.toggle('dark', isDark);
  }
}

// Initialize theme immediately
initializeTheme();

// Listen for system theme changes
darkQuery.addEventListener('change', updateDarkClass);

// Update document title based on online/offline status
function updateTitle() {
  document.title = navigator.onLine ? APP_CONFIG.APP.TITLE_ONLINE : APP_CONFIG.APP.TITLE_OFFLINE;
}

// Set initial title
updateTitle();

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then(permission => {
    console.log('Notification permission:', permission);
  });
}

// Listen for online/offline changes
window.addEventListener('online', () => {
  console.log('Back online');
  updateTitle();
  
  // Auto sync when coming back online
  if (APP_CONFIG.APP.AUTO_SYNC_ON_RECONNECT) {
    // Trigger sync event
    window.dispatchEvent(new CustomEvent('autoSync'));
  }
});

window.addEventListener('offline', () => {
  console.log('Gone offline - app will continue to work');
  updateTitle();
});

// Enhanced Service Worker registration with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('SW registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, refresh to update');
              // Optionally show update notification to user
            }
          });
        }
      });
      
      // Check for existing service worker
      if (registration.active) {
        console.log('Service worker is active and ready for offline use');
      }
      
    } catch (error) {
      console.log('SW registration failed:', error);
      // App will still work, just without offline capabilities
    }
  });
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('App cache updated');
    }
  });
}

// Hide loading fallback
setTimeout(() => {
  const loadingEl = document.getElementById('loading-fallback');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}, 100);

// Enhanced error boundary for better offline experience
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't show error to user in offline mode, as it might be network-related
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent showing network errors to user when offline
  if (!navigator.onLine && event.reason && event.reason.message && 
      (event.reason.message.includes('fetch') || event.reason.message.includes('network'))) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
