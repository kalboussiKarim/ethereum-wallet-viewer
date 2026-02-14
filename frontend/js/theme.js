/**
 * Theme Module
 * Manages dark/light mode toggling with CSS custom properties.
 * Theme preference is persisted in localStorage.
 */

const Theme = (() => {
  const STORAGE_KEY = "theme";
  const DARK = "dark";
  const LIGHT = "light";

  /**
   * Returns the saved theme or defaults based on system preference.
   * @returns {string} "dark" or "light"
   */
  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;

    // Default to system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return DARK;
    }
    return LIGHT;
  }

  /**
   * Applies the given theme to the document.
   * @param {string} theme - "dark" or "light"
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  /**
   * Updates the theme toggle button icon/text.
   * @param {string} theme - Current active theme
   */
  function updateToggleIcon(theme) {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector(".theme-icon");
    if (icon) {
      icon.textContent = theme === DARK ? "☀️" : "🌙";
    }
  }

  /**
   * Toggles between dark and light themes.
   */
  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === DARK ? LIGHT : DARK;
    applyTheme(newTheme);
  }

  /**
   * Returns the current theme.
   * @returns {string} "dark" or "light"
   */
  function getCurrent() {
    return document.documentElement.getAttribute("data-theme") || LIGHT;
  }

  /**
   * Initializes the theme system.
   */
  function init() {
    const theme = getSavedTheme();
    applyTheme(theme);
  }

  return {
    init,
    toggle,
    getCurrent,
  };
})();
