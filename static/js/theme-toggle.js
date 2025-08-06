document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const iconWrapper = document.getElementById("theme-toggle-icon");

  const updateThemeUI = (theme) => {
    if (theme === "light") {
      iconWrapper?.classList.add("navbar__theme-icon--light");
      toggleBtn?.setAttribute("aria-label", "Toggle dark theme");
    } else {
      iconWrapper?.classList.remove("navbar__theme-icon--light");
      toggleBtn?.setAttribute("aria-label", "Toggle light theme");
    }
  };

  // Update UI based on current theme (already set by inline script)
  const currentTheme = html.getAttribute("data-theme") || "dark";
  updateThemeUI(currentTheme);

  // Handle toggle click
  toggleBtn?.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    // Apply theme to DOM
    html.setAttribute("data-theme", newTheme);

    // Update UI
    updateThemeUI(newTheme);

    // Save to localStorage
    localStorage.setItem("theme", newTheme);
  });
});
