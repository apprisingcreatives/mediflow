// Service Worker for Progressive Web App (PWA) support.
// Light weight to satisfy PWA requirements while allowing dynamic web pages/APIs to function normally.

const CACHE_NAME = 'mediflow-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler for PWA requirements
  // Ensures all requests go through the network so clinic/admin dash data is never stale.
  event.respondWith(fetch(event.request));
});
