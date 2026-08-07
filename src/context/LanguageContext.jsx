import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../languages";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);

  // Load language from LocalStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");

    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }

    setLoading(false);
  }, []);

  // Change language
  const changeLanguage = (lang) => {
    if (!translations[lang]) return;

    setLanguage(lang);

    // Save to LocalStorage
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t: translations[language] || translations.en,
      }}
    >
      {!loading && children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}