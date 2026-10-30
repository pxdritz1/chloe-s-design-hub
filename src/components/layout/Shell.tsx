import { Suspense, useState } from "react";
import { LayoutDashboard, Menu, Monitor, Moon, Palette, ShieldCheck, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage, isLanguage, languages } from "../../i18n";
import { useApplyTheme } from "../../hooks/useApplyTheme";
import { usePreferences, type Theme } from "../../stores/preferences";

const themes: Theme[] = ["light", "dark", "system"];
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const languageLabels = { en: "EN", es: "ES", "pt-BR": "PT-BR" };

export function Shell() {
  const { t, i18n } = useTranslation();
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  useApplyTheme();

  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const ThemeIcon = themeIcons[theme];
  const themeLabel = `${t("theme")}: ${t(theme)}`;

  async function selectLanguage(value: string) {
    if (isLanguage(value)) await changeLanguage(value);
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-border bg-surface/70 px-5 py-7 md:flex">
        <Link to="/dashboard" className="mb-12 flex items-center gap-3 rounded-xl">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-white">
            <Palette size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">chloe's design hub</span>
            <span className="mt-0.5 block text-xs text-muted">{t("tagline")}</span>
          </span>
        </Link>
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-muted">{t("workspace")}</p>
        <Link to="/dashboard" className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5 text-sm font-medium">
          <LayoutDashboard size={17} />
          {t("allTools")}
        </Link>
        <div className="mt-auto rounded-2xl border border-border bg-elevated p-4">
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <ShieldCheck size={18} />
          </div>
          <p className="text-sm font-medium">{t("local")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-[76px] items-center justify-between gap-4 border-b border-border px-5 sm:px-8 lg:px-12">
          <button
            className="flex items-center gap-2 text-sm font-semibold md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={18} /> chloe's design hub
          </button>
          <span className="hidden text-xs text-muted md:block">{t("allTools")}</span>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">{t("language")}</label>
            <select
              id="language-select"
              value={i18n.resolvedLanguage}
              onChange={(event) => void selectLanguage(event.target.value)}
              className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-medium"
            >
              {languages.map((language) => (
                <option key={language} value={language}>{languageLabels[language]}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(nextTheme)}
              aria-label={themeLabel}
              title={themeLabel}
              className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-elevated"
            >
              <ThemeIcon size={16} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className="border-b border-border bg-surface p-4 md:hidden">
            <Link onClick={() => setMenuOpen(false)} to="/dashboard" className="flex items-center gap-2 text-sm">
              <LayoutDashboard size={16} />
              {t("allTools")}
            </Link>
          </div>
        )}
        <main className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 lg:px-12">
          <Suspense fallback={<div className="py-20" aria-busy="true" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
