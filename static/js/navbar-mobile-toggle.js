document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const mobileNavToggle = document.getElementById("mobileNavToggle");
  const mobileSearchToggle = document.getElementById("mobileSearchToggle");
  const navbarSearchInput = document.querySelector(".navbar__search-input");

  let isMobileNavExpanded = false;
  let isMobileSearchActive = false;
  let lastScrollY = window.scrollY;
  let ticking = false;

  // 🔁 Function to update all theme icons
  function updateThemeIcons(isLight) {
    document.querySelectorAll(".navbar__theme-icon").forEach((icon) => {
      icon.classList.toggle("navbar__theme-icon--light", isLight);
    });
  }

  // 📱 Mobile navbar scroll behavior with throttling
  function updateNavbarVisibility() {
    const currentScrollY = window.scrollY;
    const isMobile = window.innerWidth <= 768;

    if (isMobile && navbar) {
      const scrollThreshold = 100;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      // Only react to significant scroll movements
      if (scrollDelta > 5) {
        if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
          // Scrolling down - hide navbar
          navbar.classList.add("navbar--hidden");
          // Close any open mobile nav/search when hiding
          if (isMobileNavExpanded) {
            closeMobileNav();
          }
          if (isMobileSearchActive) {
            closeMobileSearch();
          }
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show navbar
          navbar.classList.remove("navbar--hidden");
        }
      }
    } else if (!isMobile && navbar) {
      // Always show navbar on desktop
      navbar.classList.remove("navbar--hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  function requestScrollUpdate() {
    if (!ticking) {
      requestAnimationFrame(updateNavbarVisibility);
      ticking = true;
    }
  }

  // Add scroll listener with passive option for better performance
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });

  // 🍪 Cookie utilities
  function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // 🌓 Theme toggle logic
  // Add small delay to ensure DOM is fully ready, especially for elements placed after scripts
  setTimeout(() => {
    const themeToggleButtons = document.querySelectorAll(
      "#theme-toggle, #mobile-theme-toggle",
    );

    themeToggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcons(newTheme === "light");
      });
    });
  }, 10);

  // 🧠 Update UI based on current theme (already set by inline script)
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  updateThemeIcons(currentTheme === "light");

  // 🔍 Search keyboard shortcut (Ctrl+/)
  const searchInput = document.querySelector(".navbar__search-input");

  if (searchInput) {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "/" || e.key === "?")) {
        e.preventDefault();
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          toggleMobileSearch(true);
        } else {
          searchInput.focus();
          searchInput.select();
        }
      }
    });
  }

  // 🔍 Mobile search functionality with expandable input
  const mobileSearchInput = document.getElementById("mobileSearchInput");
  const mobileSearchOverlay = document.querySelector(".navbar__mobile-search");

  function toggleMobileSearch(show = !isMobileSearchActive) {
    const isMobile = window.innerWidth <= 768;

    if (!isMobile) return;

    // Close mobile nav if it's open
    if (show && isMobileNavExpanded) {
      closeMobileNav();
    }

    isMobileSearchActive = show;
    if (navbar) {
      navbar.classList.toggle("navbar--search-active", show);
    }
    if (mobileSearchOverlay) {
      mobileSearchOverlay.classList.toggle(
        "navbar__mobile-search--active",
        show,
      );
    }

    if (show && mobileSearchInput) {
      setTimeout(() => {
        mobileSearchInput.focus();
      }, 150);
    }
  }

  function closeMobileSearch() {
    isMobileSearchActive = false;
    if (navbar) {
      navbar.classList.remove("navbar--search-active");
    }
    if (mobileSearchOverlay) {
      mobileSearchOverlay.classList.remove("navbar__mobile-search--active");
    }
    if (mobileSearchInput) {
      mobileSearchInput.value = "";
      mobileSearchInput.blur();
    }
    // Also hide search modal if it's open
    if (typeof window.hideSearchModal === "function") {
      window.hideSearchModal();
    }
  }

  // Mobile search input handling
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener("focus", () => {
      if (typeof window.showSearchModal === "function") {
        window.showSearchModal();
      }
    });

    mobileSearchInput.addEventListener("input", (e) => {
      const query = e.target.value;
      // Update the main search input to sync with search modal
      if (navbarSearchInput) {
        navbarSearchInput.value = query;
        // Trigger search
        navbarSearchInput.dispatchEvent(new Event("input"));
      }
    });

    mobileSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileSearch();
      }
    });

    // Handle escape key in mobile search
    mobileSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileSearch();
      }
    });
  }

  function closeMobileNav() {
    isMobileNavExpanded = false;
    if (navbar) {
      navbar.classList.remove("navbar--mobile-expanded");
    }
    if (mobileNavToggle) {
      mobileNavToggle.setAttribute("aria-expanded", false);
    }
  }

  // Mobile search toggle button
  if (mobileSearchToggle) {
    mobileSearchToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Close mobile nav if it's open
      if (isMobileNavExpanded) {
        closeMobileNav();
      }

      toggleMobileSearch();
    });
  }

  // Monitor search modal state changes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobileSearchActive) {
      closeMobileSearch();
    }
  });

  // Listen for search modal state changes via body class changes
  const bodyObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const hasSearchModalOpen =
          document.body.classList.contains("search-modal-open");
        const isMobile = window.innerWidth <= 768;

        if (isMobile && !hasSearchModalOpen && isMobileSearchActive) {
          // Search modal was closed, sync mobile state and close mobile search
          setTimeout(() => {
            closeMobileSearch();
          }, 100);
        }
      }
    });
  });

  // Start observing body class changes
  bodyObserver.observe(document.body, { attributes: true });

  // Global escape key handler for mobile search
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobileSearchActive) {
      closeMobileSearch();
    }
  });

  // Handle clicks outside navbar to close mobile search
  document.addEventListener("click", (e) => {
    const isMobile = window.innerWidth <= 768;

    if (isMobile && isMobileSearchActive && !navbar.contains(e.target)) {
      const searchModal = document.getElementById("search-modal");
      // Only close if not clicking on the search modal
      if (!searchModal || !searchModal.contains(e.target)) {
        closeMobileSearch();
      }
    }
  });

  // 📱 Mobile navigation toggle
  if (mobileNavToggle && navbar) {
    mobileNavToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      isMobileNavExpanded = !isMobileNavExpanded;
      navbar.classList.toggle("navbar--mobile-expanded", isMobileNavExpanded);
      mobileNavToggle.setAttribute("aria-expanded", isMobileNavExpanded);

      // Close search when toggling nav
      if (isMobileSearchActive) {
        closeMobileSearch();
      }

      // Auto-close after 10 seconds if expanded
      if (isMobileNavExpanded) {
        setTimeout(() => {
          if (isMobileNavExpanded) {
            closeMobileNav();
          }
        }, 10000);
      }
    });

    // Close mobile nav when clicking outside
    document.addEventListener("click", (e) => {
      if (isMobileNavExpanded && !navbar.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close mobile nav when a link is clicked
    const mobileNavLinks = navbar.querySelectorAll(
      ".navbar__content .navbar__link",
    );
    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMobileNav();
      });
    });
  }

  // 📱 Handle window resize to reset mobile states
  window.addEventListener("resize", () => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      // Reset mobile states when switching to desktop
      if (navbar) {
        navbar.classList.remove(
          "navbar--hidden",
          "navbar--mobile-expanded",
          "navbar--search-active",
        );
        if (mobileSearchOverlay) {
          mobileSearchOverlay.classList.remove("navbar__mobile-search--active");
        }
      }
      isMobileNavExpanded = false;
      isMobileSearchActive = false;
      if (mobileNavToggle) {
        mobileNavToggle.setAttribute("aria-expanded", false);
      }
      if (mobileSearchInput) {
        mobileSearchInput.value = "";
      }
    }
  });

  // 🎯 Mobile logo animation for touch devices
  const logoElement = document.querySelector(".navbar__logo");
  if (logoElement) {
    logoElement.addEventListener("touchstart", (e) => {
      const logoImg = logoElement.querySelector("img, svg");
      if (logoImg) {
        logoImg.style.animation = "logo-spin 9s linear infinite";
        setTimeout(() => {
          logoImg.style.animation = "";
        }, 9000);
      }
    });
  }

  // 🌐 Language selector synchronization
  const desktopLangSelect = document.getElementById("lang-select");
  const mobileLangSelect = document.getElementById("mobile-lang-select");

  function syncLanguageSelectors(sourceSelect, targetSelect) {
    if (
      sourceSelect &&
      targetSelect &&
      sourceSelect.value !== targetSelect.value
    ) {
      targetSelect.value = sourceSelect.value;
    }
  }

  if (desktopLangSelect && mobileLangSelect) {
    desktopLangSelect.addEventListener("change", () => {
      syncLanguageSelectors(desktopLangSelect, mobileLangSelect);
    });

    mobileLangSelect.addEventListener("change", () => {
      syncLanguageSelectors(mobileLangSelect, desktopLangSelect);
      // Close mobile nav after language change
      if (isMobileNavExpanded) {
        closeMobileNav();
      }
    });
  }

  // 🎯 Ensure mobile search button triggers search modal on first click
  // This handles the case where the search modal might not be initialized yet
  if (mobileSearchToggle) {
    mobileSearchToggle.addEventListener("click", (e) => {
      // Small delay to ensure search modal is properly triggered
      setTimeout(() => {
        const modal = document.getElementById("search-modal");
        if (modal && !modal.classList.contains("search-modal--active")) {
          // If modal wasn't triggered by input focus, manually show it
          if (typeof window.showSearchModal === "function") {
            window.showSearchModal();
          }
        }
      }, 50);
    });
  }
});
