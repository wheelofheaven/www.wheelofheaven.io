document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("mobileNavbarToggle");
  const mobileNavbar = document.getElementById("mobileNavbar");

  let isExpanded = false;
  let closeTimer = null;

  // 🔁 Function to update all theme icons (desktop + mobile)
  function updateThemeIcons(isLight) {
    document.querySelectorAll(".navbar__theme-icon").forEach((icon) => {
      icon.classList.toggle("navbar__theme-icon--light", isLight);
    });
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

  // 📱 Mobile navbar toggle
  if (toggleBtn && mobileNavbar) {
    toggleBtn.addEventListener("click", () => {
      isExpanded = !isExpanded;
      mobileNavbar.classList.toggle("navbar__mobile--expanded", isExpanded);
      toggleBtn.setAttribute("aria-expanded", isExpanded);

      if (isExpanded) {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          mobileNavbar.classList.remove("navbar__mobile--expanded");
          toggleBtn.setAttribute("aria-expanded", "false");
          isExpanded = false;
        }, 6000); // ⏱ Auto-close after 6 seconds
      }
    });
  }
});
