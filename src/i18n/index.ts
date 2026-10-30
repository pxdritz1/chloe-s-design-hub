import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { ptBR } from "./locales/pt-BR";

export const languages = ["en", "es", "pt-BR"] as const;
export type Language = (typeof languages)[number];

const storageKey = "chloe-design-hub-language";

export function isLanguage(value: unknown): value is Language {
  return languages.some((language) => language === value);
}

function readSavedLanguage(): Language {
  const saved = localStorage.getItem(storageKey);
  return isLanguage(saved) ? saved : "en";
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      "pt-BR": { translation: ptBR }
    },
    lng: readSavedLanguage(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false
  })
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  });

export async function changeLanguage(language: Language) {
  await i18n.changeLanguage(language);
  document.documentElement.lang = language;
  localStorage.setItem(storageKey, language);
}

export default i18n;
