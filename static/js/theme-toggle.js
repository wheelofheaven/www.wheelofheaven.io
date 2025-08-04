document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const toggleBtn = document.getElementById("theme-toggle");
  const iconWrapper = document.getElementById("theme-toggle-icon");

  const applyTheme = (theme) => {
    if (theme === "light") {
      html.setAttribute("data-theme", "light");
      iconWrapper?.classList.add("navbar__theme-icon--light");
      toggleBtn?.setAttribute("aria-label", "Toggle dark theme");
    } else {
      html.removeAttribute("data-theme");
      iconWrapper?.classList.remove("navbar__theme-icon--light");
      toggleBtn?.setAttribute("aria-label", "Toggle light theme");
    }
  };

  // Check saved theme
  const savedTheme = localStorage.getItem("theme");
  const prefersLight = window.matchMedia(
    "(prefers-color-scheme: light)",
  ).matches;

  if (savedTheme === "light" || savedTheme === "dark") {
    applyTheme(savedTheme);
  } else {
    applyTheme(prefersLight ? "light" : "dark");
  }

  // Handle toggle click
  toggleBtn?.addEventListener("click", () => {
    const isLight = html.getAttribute("data-theme") === "light";
    const newTheme = isLight ? "dark" : "light";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  });
});
