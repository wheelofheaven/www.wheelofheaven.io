// PWA functionality - Install prompts, offline detection, caching.
//
// The install + update banners no longer own their own DOM — they live
// as pre-rendered cards inside `partials/notification-stack.html` and
// are toggled via `window.WOHNotificationStack`. See
// `static/js/notification-stack.js` for the controller's API.
(function() {
    'use strict';

    // State
    let deferredPrompt = null;
    let isOnline = navigator.onLine;

    // DOM elements (created on init)
    let offlineIndicator = null;

    // Initialize PWA features
    function init() {
        registerServiceWorker();
        setupInstallPrompt();
        setupOfflineDetection();
        setupSaveForOffline();
    }

    // Convenience: notification stack controller (loaded earlier in
    // core.bundle.js). Calls degrade to no-ops if the stack is absent.
    function stack() {
        return window.WOHNotificationStack || null;
    }

    // Register Service Worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/'
                    });

                    console.log('[PWA] Service Worker registered:', registration.scope);

                    // Check for updates. Key the update card's
                    // dismissal storage by the new worker's script URL
                    // — that URL changes with every SW revision (it's
                    // cache-busted by the build), so a user who
                    // dismissed v1's update notice will still see the
                    // notice when v2 lands.
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        const swRevision = newWorker && newWorker.scriptURL
                            ? newWorker.scriptURL
                            : 'unknown';
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification(swRevision);
                            }
                        });
                    });
                } catch (error) {
                    console.error('[PWA] Service Worker registration failed:', error);
                }
            });

            // Listen for messages from Service Worker
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
        }
    }

    // Handle messages from Service Worker
    function handleSWMessage(event) {
        if (event.data.type === 'CACHE_COMPLETE') {
            showSnackbar('Page saved for offline reading');
        }
    }

    // Setup install prompt — captures the deferred prompt and asks
    // the notification stack to surface the install card.
    function setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // The stack's show() honours the per-card dismissal flag,
            // so a user who clicked × on the install card won't be
            // re-prompted until they explicitly reset.
            const s = stack();
            if (s) s.show('install');
        });

        // Track successful installs — hide the card without persisting
        // dismissal (the prompt won't fire again on this device anyway).
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App installed');
            deferredPrompt = null;
            const s = stack();
            if (s) s.hide('install');
            localStorage.setItem('pwa-installed', 'true');
        });

        // The install card's CTA is a `data-card-action="install"`
        // button inside the stack. Listen via event delegation so we
        // don't depend on the card being present at this point in
        // the boot sequence.
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-card-action="install"]');
            if (!btn) return;
            promptInstall();
        });
    }

    // Prompt install — invoked when the user clicks the install CTA
    // on the notification stack's install card.
    async function promptInstall() {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log('[PWA] Install prompt outcome:', outcome);
        deferredPrompt = null;
        const s = stack();
        // Outcome 'accepted' → user will see appinstalled and we hide
        // there. Outcome 'dismissed' → keep the card hidden but don't
        // persist (so it can re-appear next session if the browser
        // re-fires beforeinstallprompt).
        if (s) s.hide('install');
    }

    // Setup offline detection
    function setupOfflineDetection() {
        // Create offline indicator
        offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.setAttribute('role', 'status');
        offlineIndicator.setAttribute('aria-live', 'polite');
        offlineIndicator.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>You're offline</span>
        `;
        document.body.appendChild(offlineIndicator);

        // Set initial state
        updateOnlineStatus();

        // Listen for online/offline events
        window.addEventListener('online', () => {
            isOnline = true;
            updateOnlineStatus();
            showSnackbar('You\'re back online');
        });

        window.addEventListener('offline', () => {
            isOnline = false;
            updateOnlineStatus();
        });
    }

    // Update online status indicator
    function updateOnlineStatus() {
        if (!offlineIndicator) return;

        if (isOnline) {
            offlineIndicator.classList.remove('offline-indicator--visible');
        } else {
            offlineIndicator.classList.add('offline-indicator--visible');
        }

        document.body.classList.toggle('is-offline', !isOnline);
    }

    // Setup "Save for Offline" buttons
    function setupSaveForOffline() {
        // Add save button to article pages
        const saveButtons = document.querySelectorAll('[data-save-offline]');
        saveButtons.forEach(btn => {
            btn.addEventListener('click', () => saveCurrentPage(btn));
        });

        // Check if current page is cached
        checkPageCached();
    }

    // Save current page for offline
    function saveCurrentPage(button) {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            showSnackbar('Offline saving not available');
            return;
        }

        const url = window.location.pathname;
        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_URLS',
            urls: [url]
        });

        // Update button state. Keep the download icon — the SCSS
        // rainbow stroke on `.is-saved` is what signals "available
        // offline" now, paired with the title-attribute tooltip.
        if (button) {
            button.classList.add('is-saved');
            button.setAttribute('aria-pressed', 'true');
        }
    }

    // Check if current page is cached
    async function checkPageCached() {
        if (!('caches' in window)) return;

        try {
            // Look up the active pages cache by prefix so this stays
            // correct when sw.js bumps CACHE_VERSION.
            const cacheNames = await caches.keys();
            const pagesCacheName = cacheNames.find(name => name.startsWith('woh-pages-'));
            if (!pagesCacheName) return;

            const cache = await caches.open(pagesCacheName);
            const response = await cache.match(window.location.pathname);

            if (response) {
                const saveButtons = document.querySelectorAll('[data-save-offline]');
                saveButtons.forEach(btn => {
                    btn.classList.add('is-saved');
                    btn.setAttribute('aria-pressed', 'true');
                });
            }
        } catch (error) {
            console.error('[PWA] Error checking cache:', error);
        }
    }

    // Show the update card in the notification stack. The dismissal
    // key carries the new SW's script URL so a fresh release re-shows
    // the notice even if the previous version's notice was dismissed.
    function showUpdateNotification(swRevision) {
        const s = stack();
        if (!s) return;
        const dismissalKey = 'woh-banner-dismissed.update.' + (swRevision || 'unknown');
        s.show('update', { dismissalKey: dismissalKey });
    }

    // Show snackbar message
    function showSnackbar(message) {
        // Use existing snackbar if available
        const snackbar = document.querySelector('.snackbar');
        if (snackbar) {
            snackbar.textContent = message;
            snackbar.classList.add('snackbar--visible');
            setTimeout(() => {
                snackbar.classList.remove('snackbar--visible');
            }, 3000);
        } else {
            // Create temporary snackbar
            const tempSnackbar = document.createElement('div');
            tempSnackbar.className = 'snackbar snackbar--visible';
            tempSnackbar.textContent = message;
            document.body.appendChild(tempSnackbar);
            setTimeout(() => {
                tempSnackbar.remove();
            }, 3000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
