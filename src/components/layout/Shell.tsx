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
const controlClass = "h-9 rounded-xl border border-border bg-elevated text-muted transition-colors hover:text-foreground";

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
    <div className="min-h-screen bg-background p-2 text-foreground md:flex md:gap-2">
      <aside className="sticky top-2 hidden h-[calc(100vh-1rem)] w-60 shrink-0 flex-col self-start rounded-3xl border border-border bg-surface p-4 md:flex">
        <Link to="/dashboard" className="mb-10 flex items-center gap-3 rounded-xl p-1">
          <BrandMark avatar={avatar} />
          <span>
            <span className="block font-mono text-sm font-semibold tracking-tight">chloe's design hub</span>
            <span className="mt-0.5 block text-xs text-muted">{t("tagline")}</span>
          </span>
        </Link>
        <p className="mb-2 px-3 font-mono text-[11px] text-muted">{t("workspace")}</p>
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-xl bg-elevated px-3 py-2.5 font-mono text-sm"
        >
          <LayoutDashboard size={16} />
          {t("allTools")}
          <span className="ml-auto size-1.5 rounded-full bg-accent" />
        </Link>
        <div className="mt-auto rounded-2xl border border-border bg-elevated p-4">
          <ShieldCheck size={18} className="mb-3 text-accent" />
          <p className="font-mono text-xs font-semibold">{t("local")}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{t("localDescription")}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4">
          <button
            className="flex items-center gap-2 font-mono text-sm font-semibold md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
          >
            <Menu size={17} /> chloe's design hub
          </button>
          <span className="hidden font-mono text-xs text-muted md:block">{t("allTools")}</span>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">{t("language")}</label>
            <select
              id="language-select"
              value={i18n.resolvedLanguage}
              onChange={(event) => void selectLanguage(event.target.value)}
              className={`${controlClass} px-3 font-mono text-xs`}
            >
              {languages.map((language) => (
                <option key={language} value={language}>{language.toLowerCase()}</option>
              ))}
            </select>
            <button
              onClick={() => setTheme(nextTheme)}
              aria-label={themeLabel}
              title={themeLabel}
              className={`${controlClass} flex w-9 items-center justify-center`}
            >
              <ThemeIcon size={16} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <div className="rounded-2xl border border-border bg-surface p-3 md:hidden">
            <Link
              onClick={() => setMenuOpen(false)}
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-elevated px-3 py-2.5 font-mono text-sm"
            >
              <LayoutDashboard size={16} />
              {t("allTools")}
            </Link>
          </div>
        )}
        <main className="flex-1 rounded-3xl border border-border bg-surface px-5 py-8 sm:px-10 sm:py-12">
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
