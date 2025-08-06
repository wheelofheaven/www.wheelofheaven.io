// Fuse.js Search Implementation for Zola
// Uses json index format

let searchIndex = null;
let fuse = null;
let currentLanguage = "en"; // Default language

// Initialize search functionality
async function initSearch() {
  try {
    // Detect current language from HTML lang attribute or URL
    currentLanguage = document.documentElement.lang || "en";

    // Load the search index JSON file with fallback to English
    let response;
    try {
      response = await fetch(`/search_index.${currentLanguage}.json`);
      searchIndex = await response.json();

      // Check if search index is empty or minimal, fallback to English
      if (!searchIndex || searchIndex.length < 5) {
        throw new Error("Search index too small, falling back to English");
      }
    } catch (error) {
      console.warn(
        `Failed to load search index for ${currentLanguage}, falling back to English:`,
        error,
      );
      response = await fetch("/search_index.en.json");
      searchIndex = await response.json();
      currentLanguage = "en"; // Update current language to reflect fallback
    }

    // Configure Fuse.js options
    const options = {
      keys: [
        {
          name: "title",
          weight: 0.4,
        },
        {
          name: "body",
          weight: 0.6,
        },
      ],
      threshold: 0.3,
      includeMatches: true,
      includeScore: true,
      minMatchCharLength: 2,
      findAllMatches: true,
    };

    // Initialize Fuse instance
    fuse = new Fuse(searchIndex, options);

    console.log("Search initialized successfully");
  } catch (error) {
    console.error("Error initializing search:", error);
  }
}

// Create modal HTML structure (without input field)
function createSearchModal() {
  const modal = document.createElement("div");
  modal.id = "search-modal";
  modal.className = "search-modal";
  modal.innerHTML = `
    <div class="search-modal__backdrop"></div>
    <div class="search-modal__container">
      <div class="search-modal__header">
        <h3 class="search-modal__title">Search Results</h3>
        <div class="search-modal__shortcut">Press <kbd>Esc</kbd> to close</div>
        <button class="search-modal__close" aria-label="Close search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="search-modal__results" id="search-results">
        <div class="search-modal__empty">
          <p>Start typing in the search bar above...</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

// Highlight matching text
function highlightText(text, matches) {
  if (!matches || matches.length === 0) return text;

  let result = text;
  const highlights = [];

  // Collect all match indices
  matches.forEach((match) => {
    if (match.indices) {
      match.indices.forEach(([start, end]) => {
        highlights.push({ start, end });
      });
    }
  });

  // Sort by start position (descending to avoid index shifting)
  highlights.sort((a, b) => b.start - a.start);

  // Apply highlights
  highlights.forEach(({ start, end }) => {
    const before = result.slice(0, start);
    const highlighted = result.slice(start, end + 1);
    const after = result.slice(end + 1);
    result =
      before + `<mark class="search-highlight">${highlighted}</mark>` + after;
  });

  return result;
}

// Extract URI from full URL
function extractUri(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (e) {
    // Fallback: remove domain if URL parsing fails
    return url.replace(/^https?:\/\/[^\/]+/, "");
  }
}

// Extract section from URL
function extractSection(url) {
  const uri = extractUri(url);

  // Remove language prefix if present
  const pathWithoutLang = uri.replace(/^\/(?:de|fr|es|ru|ja|zh)\//, "/");

  // Extract first path segment
  const segments = pathWithoutLang.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";

  const section = segments[0];

  // Map sections to display names
  const sectionMap = {
    wiki: "Wiki",
    essentials: "Essentials",
    revelations: "Revelations",
    explainers: "Explainers",
    timeline: "Timeline",
    articles: "Articles",
    resources: "Resources",
  };

  return (
    sectionMap[section] || section.charAt(0).toUpperCase() + section.slice(1)
  );
}

// Filter search results by current language
function filterByLanguage(results) {
  return results.filter((result) => {
    const url = result.item.url;
    const urlPath = extractUri(url);

    // Check if URL contains language code
    if (currentLanguage === "en") {
      // For English, exclude URLs with language prefixes
      return !urlPath.match(/^\/(?:de|fr|es|ru|ja|zh)\//);
    } else {
      // For other languages, only include URLs with that language prefix
      return urlPath.startsWith(`/${currentLanguage}/`);
    }
  });
}

// Create truncated text with highlights
function createTruncatedText(text, matches, maxLength = 150) {
  if (!text) return "";

  let highlightedText = highlightText(text, matches);

  // If text is short enough, return as is
  if (text.length <= maxLength) {
    return highlightedText;
  }

  // Find the first match to center the truncation around
  let centerPoint = 0;
  if (
    matches &&
    matches.length > 0 &&
    matches[0].indices &&
    matches[0].indices.length > 0
  ) {
    centerPoint = matches[0].indices[0][0];
  }

  // Calculate start and end positions
  const start = Math.max(0, centerPoint - Math.floor(maxLength / 2));
  const end = Math.min(text.length, start + maxLength);

  // Extract the relevant portion and re-apply highlighting
  const truncated = text.slice(start, end);
  const adjustedMatches = matches
    ?.map((match) => ({
      ...match,
      indices: match.indices
        ?.map(([matchStart, matchEnd]) => [
          Math.max(0, matchStart - start),
          Math.min(truncated.length - 1, matchEnd - start),
        ])
        .filter(([s, e]) => s <= truncated.length && e >= 0),
    }))
    .filter((match) => match.indices && match.indices.length > 0);

  let result = highlightText(truncated, adjustedMatches);

  // Add ellipsis
  if (start > 0) result = "..." + result;
  if (end < text.length) result = result + "...";

  return result;
}

// Render search results
function renderSearchResults(results) {
  const container = document.getElementById("search-results");

  if (!results || results.length === 0) {
    container.innerHTML = `
      <div class="search-modal__empty">
        <p>No results found.</p>
      </div>
    `;
    return;
  }

  const resultsHTML = results
    .slice(0, 10)
    .map((result) => {
      const { item, matches } = result;

      // Get matches for title and body
      const titleMatches = matches?.filter((m) => m.key === "title") || [];
      const bodyMatches = matches?.filter((m) => m.key === "body") || [];

      // Highlight title
      const highlightedTitle = highlightText(item.title, titleMatches);

      // Create truncated and highlighted body
      const highlightedBody = createTruncatedText(item.body, bodyMatches, 140);
      const uri = extractUri(item.url);
      const section = extractSection(item.url);

      return `
      <a href="${item.url}" class="search-result">
        <div class="search-result__left">
          <div class="search-result__title">${highlightedTitle}</div>
          <div class="search-result__url">${uri}</div>
          <div class="search-result__section">${section}</div>
        </div>
        <div class="search-result__right">
          <div class="search-result__body">${highlightedBody}</div>
        </div>
      </a>
    `;
    })
    .join("");

  container.innerHTML = resultsHTML;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Search function
function performSearch(query) {
  if (!fuse || !query.trim()) {
    renderSearchResults([]);
    return;
  }

  const results = fuse.search(query);
  const filteredResults = filterByLanguage(results);
  renderSearchResults(filteredResults);
}

// Debounced search
const debouncedSearch = debounce(performSearch, 150);

// Show search modal
function showSearchModal() {
  const modal = document.getElementById("search-modal");
  const body = document.body;

  if (modal) {
    modal.classList.add("search-modal--active");
    body.classList.add("search-modal-open");

    // Apply blur to all elements except navbar
    const elementsToBlur = document.querySelectorAll("main, footer, .totop");
    elementsToBlur.forEach((el) => {
      el.style.filter = "blur(4px)";
      el.style.transition = "filter 0.3s ease";
    });
  }
}

// Hide search modal
function hideSearchModal() {
  const modal = document.getElementById("search-modal");
  const body = document.body;

  if (modal) {
    modal.classList.remove("search-modal--active");
    body.classList.remove("search-modal-open");

    // Remove blur from all elements
    const elementsToBlur = document.querySelectorAll("main, footer, .totop");
    elementsToBlur.forEach((el) => {
      el.style.filter = "none";
    });

    // Clear search input and results
    const navbarInput = document.querySelector(".navbar__search-input");
    if (navbarInput) {
      navbarInput.value = "";
    }
    renderSearchResults([]);
  }
}

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize search
  await initSearch();

  // Create modal
  const modal = createSearchModal();

  // Get navbar search input
  const navbarSearchInput = document.querySelector(".navbar__search-input");

  // Handle navbar search input interactions
  if (navbarSearchInput) {
    // Show modal when input is focused or clicked
    navbarSearchInput.addEventListener("focus", (e) => {
      showSearchModal();
    });

    navbarSearchInput.addEventListener("click", (e) => {
      showSearchModal();
    });

    // Handle typing in navbar input
    navbarSearchInput.addEventListener("input", (e) => {
      const query = e.target.value;

      // Show modal if not already visible and there's input
      if (query.trim() && !modal.classList.contains("search-modal--active")) {
        showSearchModal();
      }

      // Perform search
      debouncedSearch(query);

      // Hide modal if input is empty
      if (!query.trim() && modal.classList.contains("search-modal--active")) {
        hideSearchModal();
      }
    });

    // Prevent form submission on Enter key
    navbarSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  }

  // Handle modal interactions
  const closeButton = modal.querySelector(".search-modal__close");
  const backdrop = modal.querySelector(".search-modal__backdrop");

  // Close button
  closeButton.addEventListener("click", hideSearchModal);

  // Backdrop click
  backdrop.addEventListener("click", hideSearchModal);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + / to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      if (navbarSearchInput) {
        navbarSearchInput.focus();
      }
    }

    // Escape to close
    if (e.key === "Escape") {
      hideSearchModal();
      if (navbarSearchInput) {
        navbarSearchInput.blur();
      }
    }
  });

  // Handle result clicks
  modal.addEventListener("click", (e) => {
    const resultLink = e.target.closest(".search-result");
    if (resultLink) {
      hideSearchModal();
      // Let the default link behavior handle navigation
    }
  });
});

// Handle keyboard navigation in results
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("search-modal");
  if (!modal || !modal.classList.contains("search-modal--active")) return;

  const results = modal.querySelectorAll(".search-result");
  const currentFocus = document.activeElement;
  const navbarInput = document.querySelector(".navbar__search-input");

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (currentFocus === navbarInput) {
      results[0]?.focus();
    } else {
      const currentIndex = Array.from(results).indexOf(currentFocus);
      const nextIndex = Math.min(currentIndex + 1, results.length - 1);
      results[nextIndex]?.focus();
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const currentIndex = Array.from(results).indexOf(currentFocus);
    if (currentIndex > 0) {
      results[currentIndex - 1]?.focus();
    } else {
      navbarInput?.focus();
    }
  }
});
