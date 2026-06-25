/*
 * Back FAB — a history-aware "go back" button (Wikipedia mobile pattern).
 *
 * The button (`#backFab`, rendered hidden) is revealed only on the deep-
 * reading pages you dive INTO from elsewhere — wiki entries and library
 * books — and only when the reader reached them from another page on the
 * same site. So it shows when you leave, say, a timeline chapter to follow
 * an inline wiki link, but never appears on the landing page, the timeline
 * chapters themselves, /about/, or any other section. A small sessionStorage
 * map of url -> page title lets the button name its destination
 * ("Back: Preamble") instead of showing a bare arrow.
 *
 * Bundled into core.bundle.js (see scripts/bundle.js).
 */
(function () {
  "use strict";

  var STORE_KEY = "woh:navTitles";
  var MAX_ENTRIES = 30;

  function loadMap() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveMap(map) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(map));
    } catch (_) {
      /* private mode / quota — labels just degrade to the generic "Back" */
    }
  }

  function keyFor(url) {
    return url.origin + url.pathname + url.search;
  }

  function cleanTitle(raw) {
    // Drop the " | Wheel of Heaven" (or localized) site suffix so the label
    // shows just the page name.
    return (raw || "").replace(/\s*[|·]\s*[^|·]*$/, "").trim() || (raw || "").trim();
  }

  // Pages the back FAB may appear on: wiki entries and library books, in any
  // language (optional /<lang>/ prefix). Everything else — landing, /timeline/,
  // /about/, /news/, section indexes — is excluded so the button only shows
  // where the reader dove in to read.
  var ELIGIBLE = /^\/(?:(?:de|es|fr|ja|ko|ru|zh-Hant|zh|he)\/)?(?:wiki|library)\//;
  function isBackEligiblePage() {
    return ELIGIBLE.test(window.location.pathname);
  }

  function recordCurrentPage(map) {
    var here = keyFor(window.location);
    map[here] = cleanTitle(document.title);
    var keys = Object.keys(map);
    if (keys.length > MAX_ENTRIES) {
      // Cheap prune: drop the oldest-inserted key.
      delete map[keys[0]];
    }
    saveMap(map);
  }

  function init() {
    var map = loadMap();
    var btn = document.getElementById("backFab");

    // Only reveal on eligible (wiki / library) pages reached from another
    // same-site page. The button markup ships on every page, but stays hidden
    // everywhere else.
    if (btn && isBackEligiblePage()) {
      var cameFromSite = false;
      var referrerKey = "";
      if (document.referrer) {
        try {
          var ref = new URL(document.referrer);
          if (ref.origin === window.location.origin) {
            referrerKey = keyFor(ref);
            if (referrerKey !== keyFor(window.location)) {
              cameFromSite = true;
            }
          }
        } catch (_) {
          /* malformed referrer — leave hidden */
        }
      }

      if (cameFromSite && window.history.length > 1) {
        var destTitle = map[referrerKey];
        if (destTitle) {
          var base = btn.getAttribute("aria-label") || "Back";
          var full = base + ": " + destTitle;
          btn.setAttribute("aria-label", full);
          btn.setAttribute("title", full);
          var labelEl = btn.querySelector(".back-fab__label");
          if (labelEl) labelEl.textContent = destTitle;
        }

        btn.addEventListener("click", function () {
          if (window.history.length > 1) {
            window.history.back();
          } else if (document.referrer) {
            window.location.href = document.referrer;
          }
        });

        btn.hidden = false;
        // Next frame so the entrance transition runs.
        window.requestAnimationFrame(function () {
          btn.classList.add("back-fab--visible");
        });
      }
    }

    // Record on EVERY page (even ineligible ones like the landing page or a
    // timeline chapter) so an eligible destination can still label the page we
    // came from ("Back: Preamble"). Runs after the referrer read above.
    recordCurrentPage(map);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
