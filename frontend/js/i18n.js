/**
 * i18n Module
 * Handles internationalization (English/French) with JSON translation files.
 * Uses data-i18n attributes on DOM elements to dynamically swap text.
 */

const I18n = (() => {
  // Cache loaded translations
  const translations = {};
  let currentLang = localStorage.getItem("lang") || "en";

  /**
   * Loads a translation JSON file for the given language.
   * @param {string} lang - Language code ("en" or "fr")
   * @returns {Promise<Object>} Translation key-value pairs
   */
  async function loadTranslations(lang) {
    if (translations[lang]) {
      return translations[lang];
    }

    try {
      const response = await fetch(`./locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
      translations[lang] = await response.json();
      return translations[lang];
    } catch (error) {
      console.error(`[i18n] Error loading ${lang} translations:`, error);
      return {};
    }
  }

  /**
   * Translates a single key using the current language.
   * @param {string} key - Translation key (e.g. "connect.button")
   * @returns {string} Translated string or the key itself if not found
   */
  function t(key) {
    const langData = translations[currentLang];
    return (langData && langData[key]) || key;
  }

  /**
   * Applies translations to all DOM elements with data-i18n attribute.
   * Also updates elements with data-i18n-placeholder for input placeholders.
   */
  function applyTranslations() {
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translated = t(key);
      if (translated !== key) {
        el.textContent = translated;
      }
    });

    // Handle placeholder translations
    const placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    placeholders.forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const translated = t(key);
      if (translated !== key) {
        el.placeholder = translated;
      }
    });

    // Update the html lang attribute
    document.documentElement.lang = currentLang;
  }

  /**
   * Sets the active language, loads translations if needed, and updates the DOM.
   * @param {string} lang - Language code ("en" or "fr")
   */
  async function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    await loadTranslations(lang);
    applyTranslations();
  }

  /**
   * Toggles between English and French.
   */
  async function toggleLanguage() {
    const newLang = currentLang === "en" ? "fr" : "en";
    await setLanguage(newLang);
  }

  /**
   * Returns the current language code.
   * @returns {string} Current language code
   */
  function getCurrentLang() {
    return currentLang;
  }

  /**
   * Initializes the i18n system: loads the saved language and applies translations.
   */
  async function init() {
    await loadTranslations(currentLang);
    applyTranslations();
  }

  return {
    init,
    t,
    setLanguage,
    toggleLanguage,
    getCurrentLang,
    applyTranslations,
  };
})();
