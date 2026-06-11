// Notification stack controller.
//
// Owns the deck-of-cards UI at the top of every page that consolidates
// the project's three notification banners:
//
//   * update      — promoted to the front when the service worker
//                   installs a new revision. Reload to apply.
//   * install     — soft CTA to install the PWA, shown after the
//                   browser fires `beforeinstallprompt`.
//   * translation — server-rendered on non-English pages. Persistent
//                   informational card; user can dismiss permanently.
//
// Front-to-back stack order is fixed: update > install > translation.
// When the front card is dismissed, the next visible card eases
// forward into the front slot.
//
// Public API exposed on `window.WOHNotificationStack` so pwa.js (which
// runs as its own DOMContentLoaded handler) can drive the install and
// update cards without owning their DOM:
//
//   show(id, opts)       — make a card visible; honours dismissal storage.
//                          opts.force=true bypasses dismissal storage.
//                          opts.dismissalKey overrides the storage key
//                          (used for update: woh-banner-dismissed.update.<sw-rev>)
//   hide(id)             — make a card invisible without persisting dismissal.
//   isDismissed(id, key) — has the user clicked × on this card?
//
// Dismissals are written to localStorage:
//   - translation: woh-banner-dismissed.translation        (forever)
//   - install:     woh-banner-dismissed.install            (until next prompt)
//   - update:      woh-banner-dismissed.update.<sw-rev>    (until next SW rev)

(function () {
    "use strict";

    const STORAGE_PREFIX = "woh-banner-dismissed.";
    const STACK_SLOTS = ["front", "mid", "back"]; // front-to-back order
    const QUEUE_ORDER = ["update", "install", "translation"]; // priority order

    const root = document.querySelector("[data-notification-stack]");
    if (!root) return;

    // Map of card-id → element. Includes cards that are present in the
    // DOM regardless of current visibility.
    const cards = new Map();
    root.querySelectorAll(".notification-card").forEach((card) => {
        const id = card.getAttribute("data-card-id");
        if (id) cards.set(id, card);
    });

    // Per-card dismissal storage key. The update key is dynamic (it
    // carries the SW revision so a new release re-shows the card even
    // after the user dismissed the previous version's notice). pwa.js
    // overrides it via `show("update", { dismissalKey: "..." })`.
    const dismissalKeys = {
        translation: STORAGE_PREFIX + "translation",
        install: STORAGE_PREFIX + "install",
        update: STORAGE_PREFIX + "update",
    };

    function safeGetItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (_) {
            return null;
        }
    }
    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (_) {
            /* swallow — quota / private mode */
        }
    }

    function isDismissed(id, key) {
        const k = key || dismissalKeys[id];
        if (!k) return false;
        return safeGetItem(k) === "1";
    }

    // Which cards are currently visible? Visibility = element present
    // AND `hidden` attribute absent.
    function visibleCardIds() {
        return QUEUE_ORDER.filter((id) => {
            const el = cards.get(id);
            return el && !el.hasAttribute("hidden");
        });
    }

    // Re-apply stack-position classes (--stack-front / --stack-mid /
    // --stack-back) to whichever cards are currently visible, in
    // QUEUE_ORDER. Cards beyond the third visible queue position get
    // no stack-position class and remain hidden via the SCSS
    // `:not(--stack-front):not(--stack-mid):not(--stack-back)` rule.
    function restack() {
        const visible = visibleCardIds();

        cards.forEach((card) => {
            STACK_SLOTS.forEach((slot) => {
                card.classList.remove("notification-card--stack-" + slot);
            });
            card.classList.remove("notification-card--leaving");
        });

        visible.forEach((id, index) => {
            const slot = STACK_SLOTS[index];
            if (!slot) return;
            const card = cards.get(id);
            if (card) card.classList.add("notification-card--stack-" + slot);
        });

        root.setAttribute("data-visible-count", String(visible.length));
        publishHeight();
    }

    // Publish `--notification-stack-h` and `--navbar-h` so the
    // navbar/main layout follows the stack's actual size. Mirrors the
    // measurement responsibility the old translation-notice-script
    // partial used to handle.
    function rem() {
        return (
            parseFloat(
                getComputedStyle(document.documentElement).fontSize
            ) || 16
        );
    }
    function publishHeight() {
        const r = rem();
        const stackH = root.offsetHeight; // 0 when collapsed via display:none
        const navbar = document.querySelector(".navbar");
        const navbarH = navbar ? navbar.offsetHeight : 0;
        document.documentElement.style.setProperty(
            "--notification-stack-h",
            (stackH / r).toFixed(3) + "rem"
        );
        if (navbar) {
            document.documentElement.style.setProperty(
                "--navbar-h",
                (navbarH / r).toFixed(3) + "rem"
            );
        }
    }

    // Animate the navbar's `top` from below-the-stack to its
    // English-page position as the stack scrolls out of view. Same
    // behaviour the old translation-notice-script provided, generalised
    // to any visible-stack state. No-op when the stack is empty.
    let bannerH = 0;
    let navbarStart = 0;
    let navbarMin = 0;
    let range = 0;
    const navbar = document.querySelector(".navbar");

    function measureScrollRange() {
        if (!navbar) return;
        const r = rem();
        bannerH = root.offsetHeight;
        // The stack itself sits at `top: 0.5rem`; the navbar docks
        // below it with a 1rem gap. So navbarStart = stack top offset
        // + stack height + gap — same composition as the body-level
        // calc in _notification-stack.scss.
        navbarStart = 0.5 * r + bannerH + r;
        navbarMin = 0.5 * r; // English navbar position
        range = navbarStart - navbarMin;
    }

    function updateNavbarTop() {
        if (!navbar || range <= 0) return;
        const scrollY = Math.max(0, window.scrollY);
        const ratio = Math.min(1, scrollY / range);
        const top = navbarStart - range * ratio;
        navbar.style.top = top + "px";
    }

    let scheduled = false;
    function onScroll() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            updateNavbarTop();
            scheduled = false;
        });
    }

    function refreshMeasurements() {
        publishHeight();
        measureScrollRange();
        updateNavbarTop();
    }

    // Show a card. Returns true if the card is now visible, false if
    // the request was suppressed (dismissed or unknown id).
    function show(id, opts) {
        opts = opts || {};
        const card = cards.get(id);
        if (!card) return false;
        if (!opts.force && isDismissed(id, opts.dismissalKey)) return false;
        if (opts.dismissalKey) dismissalKeys[id] = opts.dismissalKey;
        if (!card.hasAttribute("hidden")) {
            restack();
            return true;
        }
        card.removeAttribute("hidden");
        restack();
        // Re-measure after a frame so the new card is in the layout.
        requestAnimationFrame(refreshMeasurements);
        return true;
    }

    function hide(id) {
        const card = cards.get(id);
        if (!card) return;
        if (card.hasAttribute("hidden")) return;
        card.setAttribute("hidden", "");
        restack();
        requestAnimationFrame(refreshMeasurements);
    }

    function dismiss(id) {
        const card = cards.get(id);
        if (!card) return;
        safeSetItem(dismissalKeys[id], "1");
        // Brief leaving animation, then hide. The leaving class is
        // already mutually exclusive with the stack-position classes
        // via restack(), so add it first, wait, then hide.
        card.classList.add("notification-card--leaving");
        setTimeout(() => {
            hide(id);
        }, 250);
    }

    // Wire dismiss + custom action buttons via event delegation so the
    // PWA cards (whose CTAs trigger SW-controlled behavior) can be
    // handled by pwa.js without needing direct DOM ownership.
    root.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-card-action]");
        if (!btn) return;
        const card = btn.closest(".notification-card");
        if (!card) return;
        const id = card.getAttribute("data-card-id");
        const action = btn.getAttribute("data-card-action");
        if (action === "dismiss") {
            dismiss(id);
            return;
        }
        if (action === "reload") {
            // Update card: just reload. SW will activate the new
            // version on next navigation regardless, but reload
            // applies it immediately.
            window.location.reload();
            return;
        }
        // Other actions (install) are handled by pwa.js — let it bubble.
    });

    // Initial state: server-rendered cards (e.g. translation on non-EN
    // pages) are visible; install/update start hidden. Honour
    // dismissal storage so a dismissed translation card doesn't
    // re-appear on every navigation.
    cards.forEach((card, id) => {
        if (!card.hasAttribute("hidden") && isDismissed(id)) {
            card.setAttribute("hidden", "");
        }
    });
    restack();
    refreshMeasurements();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
        refreshMeasurements();
    });

    // Expose the controller so pwa.js can drive cards without owning
    // their DOM.
    window.WOHNotificationStack = {
        show: show,
        hide: hide,
        dismiss: dismiss,
        isDismissed: isDismissed,
    };
})();
