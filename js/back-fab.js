/*
 * Back FAB — a history-aware "go back" button (Wikipedia mobile pattern).
 *
 * The button (`#backFab`, rendered hidden) is revealed only when the reader
 * reached this page from another page on the same site, so a single tap can
 * return them to whatever they were reading — typically a timeline chapter
 * they left to follow an inline wiki link. A small sessionStorage map of
 * url -> page title lets the button name its destination ("Back: Preamble")
 * instead of a bare arrow.
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
    var btn = document.getElementById("backFab");
    if (!btn) return;

    var map = loadMap();

    // Did we arrive from another page on this same site?
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

    // Record AFTER reading the referrer so we never clobber our own entry.
    recordCurrentPage(map);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
