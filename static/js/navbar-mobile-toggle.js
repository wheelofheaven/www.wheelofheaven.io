document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("mobileNavbarToggle");
  const mobileNavbar = document.getElementById("mobileNavbar");

  let isExpanded = false;
  let closeTimer = null;
  let isSearchActive = false;
  let isLeftHanded = false;

  // 🔁 Function to update all theme icons (desktop + mobile)
  function updateThemeIcons(isLight) {
    document.querySelectorAll(".navbar__theme-icon").forEach((icon) => {
      icon.classList.toggle("navbar__theme-icon--light", isLight);
    });
  }

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

  // 👐 Handedness functionality
  function updateHandedness(leftHanded) {
    isLeftHanded = leftHanded;
    const toTopBtn = document.querySelector(".to-top");
    const mobileToggleContainer = document.querySelector(
      ".navbar__mobile-toggle-container",
    );
    const handednessToggle = document.querySelector(
      ".navbar__handedness-toggle",
    );
    const handednessIcon = handednessToggle?.querySelector("svg");

    // Update mobile navbar
    if (mobileNavbar) {
      mobileNavbar.classList.toggle("navbar__mobile--left", leftHanded);
    }
    if (mobileToggleContainer) {
      mobileToggleContainer.classList.toggle(
        "navbar__mobile-toggle-container--left",
        leftHanded,
      );
    }

    // Update to-top button
    if (toTopBtn) {
      toTopBtn.classList.toggle("to-top--left", leftHanded);
    }

    // Update handedness toggle icon direction
    if (handednessIcon) {
      if (leftHanded) {
        handednessIcon.innerHTML = '<path d="m15 18-6-6 6-6"/>';
      } else {
        handednessIcon.innerHTML = '<path d="m9 18 6-6-6-6"/>';
      }
    }

    // Save preference
    setCookie("handedness", leftHanded ? "left" : "right");
  }

  // Initialize handedness from cookie
  const savedHandedness = getCookie("handedness");
  if (savedHandedness === "left") {
    updateHandedness(true);
  }

  // 🌓 Theme toggle logic
  const themeToggleButtons = document.querySelectorAll(
    "#theme-toggle, #mobile-theme-toggle",
  );

  themeToggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcons(newTheme === "light");
    });
  });

  // 🧠 Respect OS/browser preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("theme");
  const effectiveTheme = savedTheme || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  updateThemeIcons(effectiveTheme === "light");

  // 🔍 Desktop search keyboard shortcut (Ctrl+/)
  const desktopSearchInput = document.querySelector(".navbar__search-input");

  if (desktopSearchInput) {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && (e.key === "/" || e.key === "?")) {
        e.preventDefault();
        desktopSearchInput.focus();
        desktopSearchInput.select();
      }
    });
  }

  // 🔍 Mobile search toggle functionality
  const mobileSearchToggle = document.getElementById("mobileSearchToggle");
  const mobileSearchField = document.getElementById("mobileSearchField");

  function resetSearch() {
    if (mobileNavbar && mobileSearchField) {
      mobileNavbar.classList.remove("navbar__mobile--search-active");
      mobileSearchField.value = "";
      isSearchActive = false;
    }
  }

  if (mobileSearchToggle && mobileSearchField) {
    mobileSearchToggle.addEventListener("click", () => {
      isSearchActive = !isSearchActive;
      mobileNavbar.classList.toggle(
        "navbar__mobile--search-active",
        isSearchActive,
      );

      if (isSearchActive) {
        // Focus the input field when search is activated
        setTimeout(() => {
          mobileSearchField.focus();
        }, 100);
      }
    });

    // Close search when clicking outside mobile navbar or pressing escape
    document.addEventListener("click", (e) => {
      if (isSearchActive && !mobileNavbar.contains(e.target)) {
        resetSearch();
      }
    });

    mobileSearchField.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        resetSearch();
      }
    });

    // Prevent auto-close timer while user is actively typing
    let typingTimer;
    mobileSearchField.addEventListener("input", () => {
      clearTimeout(closeTimer);
      clearTimeout(typingTimer);

      // Reset auto-close timer after user stops typing for 2 seconds
      if (mobileSearchField.value.trim() === "") {
        typingTimer = setTimeout(() => {
          if (isExpanded) {
            closeTimer = setTimeout(() => {
              mobileNavbar.classList.remove("navbar__mobile--expanded");
              toggleBtn.setAttribute("aria-expanded", "false");
              isExpanded = false;
              resetSearch();
            }, 4000);
          }
        }, 2000);
      }
    });
  }

  // 📱 Mobile navbar toggle
  if (toggleBtn && mobileNavbar) {
    toggleBtn.addEventListener("click", () => {
      isExpanded = !isExpanded;
      mobileNavbar.classList.toggle("navbar__mobile--expanded", isExpanded);
      toggleBtn.setAttribute("aria-expanded", isExpanded);

      // Reset search when navbar is toggled
      resetSearch();

      if (isExpanded) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          mobileNavbar.classList.remove("navbar__mobile--expanded");
          toggleBtn.setAttribute("aria-expanded", "false");
          isExpanded = false;
          resetSearch(); // Also reset search when auto-closing
        }, 6000); // ⏱ Auto-close after 6 seconds
      }
    });
  }

  // 👐 Handedness toggle
  const handednessToggle = document.querySelector(".navbar__handedness-toggle");
  if (handednessToggle) {
    handednessToggle.addEventListener("click", () => {
      updateHandedness(!isLeftHanded);
    });
  }
});
