import { Suspense, useState } from "react";
import { LayoutDashboard, Menu, Monitor, Moon, ShieldCheck, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage, isLanguage, languages } from "../../i18n";
import { useApplyTheme } from "../../hooks/useApplyTheme";
import { useFavicon } from "../../hooks/useFavicon";
import { useGithubAvatar } from "../../hooks/useGithubAvatar";
import { usePreferences, type Theme } from "../../stores/preferences";
import { BrandMark } from "./BrandMark";

const themes: Theme[] = ["light", "dark", "system"];
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const island = "border border-border bg-surface/80 shadow-soft backdrop-blur-xl";
const control = "h-10 rounded-full border border-border bg-elevated text-muted transition-colors hover:text-foreground";

export function Shell() {
  const { t, i18n } = useTranslation();
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar = useGithubAvatar();
  useApplyTheme();
  useFavicon(avatar);

  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const ThemeIcon = themeIcons[theme];
  const themeLabel = `${t("theme")}: ${t(theme)}`;

  async function selectLanguage(value: string) {
    if (isLanguage(value)) await changeLanguage(value);
  }

  return (
    <div className="min-h-screen p-3 text-foreground md:flex md:gap-3">
      <aside className={`${island} sticky top-3 hidden h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col self-start rounded-[2rem] p-4 md:flex`}>
        <Link to="/dashboard" className="mb-10 flex items-center gap-3 rounded-2xl p-1.5">
          <BrandMark avatar={avatar} />
          <span>
            <span className="block text-[15px] font-semibold tracking-tight">chloe's design hub</span>
            <span className="mt-0.5 block text-xs text-muted">{t("tagline")}</span>
          </span>
        </Link>
        <p className="mb-2 px-4 text-xs font-medium text-muted">{t("workspace")}</p>
        <Link to="/dashboard" className="flex items-center gap-3 rounded-full bg-sage-soft px-4 py-2.5 text-sm font-medium">
          <LayoutDashboard size={17} />
          {t("allTools")}
        </Link>
        <div className="mt-auto rounded-3xl border border-border bg-elevated p-4">
          <span className="mb-3 flex size-9 items-center justify-center rounded-2xl bg-sage-soft text-accent">
            <ShieldCheck size={18} />
          </span>
          <p className="text-sm font-semibold">{t("local")}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className={`${island} flex h-16 items-center justify-between gap-3 rounded-full px-3 pl-6`}>
          <button
            className="flex items-center gap-2 text-sm font-semibold md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={18} /> chloe's design hub
          </button>
          <span className="hidden text-sm text-muted md:block">{t("allTools")}</span>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">{t("language")}</label>
            <select
              id="language-select"
              value={i18n.resolvedLanguage}
              onChange={(event) => void selectLanguage(event.target.value)}
              className={`${control} px-4 text-sm font-medium`}
            >
              {languages.map((language) => (
                <option key={language} value={language}>{language.toLowerCase()}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(nextTheme)}
              aria-label={themeLabel}
              title={themeLabel}
              className={`${control} flex w-10 items-center justify-center`}
            >
              <ThemeIcon size={17} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className={`${island} rounded-3xl p-3 md:hidden`}>
            <Link
              onClick={() => setMenuOpen(false)}
              to="/dashboard"
              className="flex items-center gap-2 rounded-full bg-sage-soft px-4 py-2.5 text-sm font-medium"
            >
              <LayoutDashboard size={17} />
              {t("allTools")}
            </Link>
          </div>
        )}
        <main className={`${island} flex-1 rounded-[2rem] px-5 py-8 sm:px-10 sm:py-12`}>
          <div className="mx-auto w-full max-w-[1200px]">
            <Suspense fallback={<div className="py-20" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
