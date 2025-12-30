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
      threshold: 0.1,
      includeMatches: true,
      includeScore: true,
      minMatchCharLength: 4,
      findAllMatches: false,
      ignoreLocation: true,
      useExtendedSearch: true,
    };

    // Initialize Fuse instance
    fuse = new Fuse(searchIndex, options);

    console.log("Search initialized successfully");
  } catch (error) {
    console.error("Error initializing search:", error);
  }
}

// Get icon for section
function getSectionIcon(section) {
  const icons = {
    Home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>`,
    Essentials: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12h8"/>
      <path d="M12 8v8"/>
    </svg>`,
    Explainers: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>`,
    Timeline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>`,
    Revelations: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>`,
    Wiki: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <path d="M8 7h8"/>
      <path d="M8 11h8"/>
      <path d="M8 15h6"/>
    </svg>`,
    Articles: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>`,
    Resources: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,
  };

  return icons[section] || "";
}

// Get navigation links based on current language
function getNavigationLinks() {
  const baseUrl = currentLanguage === "en" ? "" : `/${currentLanguage}`;

  return [
    {
      title: "Home",
      url: baseUrl || "/",
      section: "Home",
      description: "Welcome page and site overview",
      body: "Discover the cosmic perspective of Wheel of Heaven, exploring ancient wisdom and modern insights about our place in the universe. Start your journey into understanding the deeper meanings behind existence.",
    },
    {
      title: "Essentials",
      url: `${baseUrl}/essentials/`,
      section: "Essentials",
      description: "Core concepts and fundamental information",
      body: "Master the foundational principles and key concepts that form the backbone of Wheel of Heaven teachings. Essential reading for understanding the broader philosophical framework.",
    },
    {
      title: "Explainers",
      url: `${baseUrl}/explainers/`,
      section: "Explainers",
      description: "Detailed explanations of key topics",
      body: "Dive deep into complex subjects with comprehensive explanations that break down intricate concepts into understandable insights. Perfect for gaining thorough understanding of specific topics.",
    },
    {
      title: "Timeline",
      url: `${baseUrl}/timeline/`,
      section: "Timeline",
      description: "Chronological overview of events",
      body: "Follow the historical progression of events and revelations through time. Understand how ancient wisdom connects to modern discoveries in this comprehensive chronological journey.",
    },
    {
      title: "Revelations",
      url: `${baseUrl}/revelations/`,
      section: "Revelations",
      description: "Sacred texts and divine messages",
      body: "Explore the profound messages and teachings revealed through divine communication. Access the sacred texts that form the spiritual foundation of the Wheel of Heaven philosophy.",
    },
    {
      title: "Wiki",
      url: `${baseUrl}/wiki/`,
      section: "Wiki",
      description: "Comprehensive knowledge database",
      body: "Access the complete repository of knowledge covering all aspects of Wheel of Heaven teachings. Find detailed articles, cross-references, and in-depth documentation of concepts and ideas.",
    },
  ];
}

// Create navigation links HTML
function createNavigationLinks() {
  const links = getNavigationLinks();

  return `
    <div class="search-modal__navigation">
      <h4 class="search-modal__navigation-title">Navigate the site</h4>
      ${links
        .map(
          (link) => `
        <a href="${link.url}" class="search-result">
          <div class="search-result__left">
            <div class="search-result__title">${link.title}</div>
            <div class="search-result__url">${link.url}</div>
            <div class="search-result__section">
              <span class="search-result__section-icon">${getSectionIcon(link.section)}</span>
              ${link.section}
            </div>
          </div>
          <div class="search-result__right">
            <div class="search-result__body">
              <div class="search-result__description">${link.description}</div>
              <div class="search-result__preview">${link.body}</div>
            </div>
          </div>
        </a>
      `,
        )
        .join("")}
    </div>
  `;
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
        ${createNavigationLinks()}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

// Highlight matching text
function highlightText(text, query) {
  if (!query || query.trim().length < 4) return text;

  // Split query into words and filter out short ones
  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length >= 4);

  if (searchTerms.length === 0) return text;

  let result = text;

  // Use regex-based whole word highlighting
  searchTerms.forEach((term) => {
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create regex for whole word matching (case insensitive)
    const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");

    result = result.replace(regex, (match) => {
      return `<mark class="search-highlight">${match.trim()}</mark>`;
    });
  });

  // Clean up any extra whitespace around mark tags
  result = result.replace(
    /\s*<mark class="search-highlight">/g,
    '<mark class="search-highlight">',
  );
  result = result.replace(/<\/mark>\s*/g, "</mark>");

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

// Create truncated text (highlighting will be applied later)
function createTruncatedText(text, matches, maxLength = 150) {
  if (!text) return "";

  // If text is short enough, return as is
  if (text.length <= maxLength) {
    return text;
  }

  // Find the first match to center the truncation around
  let centerPoint = Math.floor(text.length / 2);
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

  // Extract the relevant portion
  let result = text.slice(start, end);

  // Add ellipsis
  if (start > 0) result = "..." + result;
  if (end < text.length) result = result + "...";

  return result;
}

// Create empty state HTML when no results found for a query
function createEmptyState(query) {
  return `
    <div class="search-modal__empty-state">
      <div class="search-modal__empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </div>
      <h4 class="search-modal__empty-title">No results found</h4>
      <p class="search-modal__empty-text">
        No matches for "<strong>${query}</strong>". Try different keywords or browse the site sections below.
      </p>
    </div>
    ${createNavigationLinks()}
  `;
}

// Render search results
function renderSearchResults(results, query = "") {
  const container = document.getElementById("search-results");

  if (!results || results.length === 0) {
    // If there's a query but no results, show empty state
    if (query && query.trim().length >= 4) {
      container.innerHTML = createEmptyState(query);
    } else {
      container.innerHTML = createNavigationLinks();
    }
    return;
  }

  const resultsHTML = results
    .slice(0, 10)
    .map((result) => {
      const { item, matches } = result;

      // Highlight title and body using query
      const highlightedTitle = highlightText(item.title, query);

      // Create truncated text first, then highlight
      const truncatedBody = createTruncatedText(
        item.body,
        matches?.filter((m) => m.key === "body") || [],
        140,
      );
      const highlightedBody = highlightText(truncatedBody, query);
      const uri = extractUri(item.url);
      const section = extractSection(item.url);

      return `
      <a href="${item.url}" class="search-result">
        <div class="search-result__left">
          <div class="search-result__title">${highlightedTitle}</div>
          <div class="search-result__url">${uri}</div>
          <div class="search-result__section">
            <span class="search-result__section-icon">${getSectionIcon(section)}</span>
            ${section}
          </div>
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
  renderSearchResults(filteredResults, query);
}

// Debounced search
const debouncedSearch = debounce(performSearch, 150);

// Show search modal
function showSearchModal() {
  const modal = document.getElementById("search-modal");
  const body = document.body;

  if (modal) {
    // Close any open navbar dropdowns
    if (window.navbarDropdown) {
      window.navbarDropdown.closeAllDropdowns();
    }

    modal.classList.add("search-modal--active");
    body.classList.add("search-modal-open");

    // Apply blur to all elements except navbar
    const elementsToBlur = document.querySelectorAll("main, footer, .totop");
    elementsToBlur.forEach((el) => {
      el.style.filter = "blur(4px)";
      el.style.transition = "filter 0.3s ease";
    });

    // Blur navbar elements except search input
    const navbarElementsToBlur = document.querySelectorAll(
      ".navbar__logo, .navbar__links, .navbar__language-switcher, .navbar__theme-toggle, .navbar__mobile-toggle",
    );
    navbarElementsToBlur.forEach((el) => {
      el.style.filter = "blur(2px)";
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

    // Remove blur from navbar elements
    const navbarElementsToBlur = document.querySelectorAll(
      ".navbar__logo, .navbar__links, .navbar__language-switcher, .navbar__theme-toggle, .navbar__mobile-toggle",
    );
    navbarElementsToBlur.forEach((el) => {
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

  // Handle navigation link clicks
  modal.addEventListener("click", (e) => {
    const navLink = e.target.closest(".search-navigation-link");
    if (navLink) {
      hideSearchModal();
      // Let the default link behavior handle navigation
    }
  });

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

  // Handle search result clicks
  modal.addEventListener("click", (e) => {
    const resultLink = e.target.closest(".search-result");
    if (resultLink) {
      hideSearchModal();
      // Let the default link behavior handle navigation
    }
  });
});

// Handle keyboard navigation in results and navigation links
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("search-modal");
  if (!modal || !modal.classList.contains("search-modal--active")) return;

  const results = modal.querySelectorAll(".search-result");
  const navLinks = modal.querySelectorAll(".search-navigation-link");
  const allFocusable = [...results, ...navLinks];
  const currentFocus = document.activeElement;
  const navbarInput = document.querySelector(".navbar__search-input");

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (currentFocus === navbarInput) {
      allFocusable[0]?.focus();
    } else {
      const currentIndex = Array.from(allFocusable).indexOf(currentFocus);
      const nextIndex = Math.min(currentIndex + 1, allFocusable.length - 1);
      allFocusable[nextIndex]?.focus();
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const currentIndex = Array.from(allFocusable).indexOf(currentFocus);
    if (currentIndex > 0) {
      allFocusable[currentIndex - 1]?.focus();
    } else {
      navbarInput?.focus();
    }
  }
});
