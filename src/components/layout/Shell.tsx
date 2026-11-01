import { Suspense, useState } from "react";
import { LayoutGrid, Menu, Monitor, Moon, Palette, ScanLine, Shapes, Sun, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeLanguage, isLanguage, languages } from "../../i18n";
import { useApplyTheme } from "../../hooks/useApplyTheme";
import { useFavicon } from "../../hooks/useFavicon";
import { useGithubAvatar } from "../../hooks/useGithubAvatar";
import { usePreferences, type Theme } from "../../stores/preferences";
import { BrandMark } from "./BrandMark";
import { SidebarInsights } from "./SidebarInsights";

const themes: Theme[] = ["light", "dark", "system"];
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const navigation = [
  { to: "/dashboard", label: "allTools", icon: LayoutGrid, end: true },
  { to: "/tools/wallpaper-studio", label: "tools.wallpaper.name", icon: Palette },
  { to: "/tools/color-matrix", label: "tools.colorMatrix.name", icon: Shapes },
  { to: "/tools/background-remover", label: "tools.background.name", icon: ScanLine }
];

export function Shell() {
  const { t, i18n } = useTranslation();
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatar = useGithubAvatar();
  const location = useLocation();
  useApplyTheme();
  useFavicon(avatar);

  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  const ThemeIcon = themeIcons[theme];
  const current = navigation.find((item) => item.to === location.pathname);
  const pageLabel = current ? t(current.label) : t("workspace");

  async function selectLanguage(value: string) {
    if (isLanguage(value)) await changeLanguage(value);
  }

  const navLinks = (mobile = false) => navigation.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => mobile && setMenuOpen(false)}
        className={({ isActive }) => `group flex min-h-12 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors ${isActive ? "bg-sage-soft text-foreground" : "text-muted hover:bg-surface hover:text-foreground"}`}
      >
        <Icon size={18} strokeWidth={1.8} />
        {t(item.label)}
      </NavLink>
    );
  });

  return (
    <div className="min-h-screen p-3 text-foreground md:flex md:gap-4 md:p-4">
      <a href="#main-content" className="sr-only z-50 rounded-full bg-accent px-4 py-3 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4">{t("skipToContent")}</a>
      <aside className="surface-panel sticky top-4 hidden h-[calc(100vh-2rem)] min-h-0 w-[18rem] shrink-0 flex-col overflow-y-auto overscroll-contain rounded-[1.75rem] p-3 md:flex">
        <Link to="/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-4">
          <BrandMark avatar={avatar} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-tight">chloe's design hub</span>
            <span className="mt-0.5 block text-xs text-muted">{t("tagline")}</span>
          </span>
        </Link>

        <div className="mt-auto shrink-0">
          <SidebarInsights />
        </div>
        <p className="px-3 pb-1 pt-3 text-center text-[10px] text-muted">{t("local")}</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="surface-panel flex min-h-16 items-center gap-3 rounded-full px-3 pl-5">
          <button
            className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("menu")}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{pageLabel}</p>
            <p className="hidden text-[11px] text-muted sm:block">chloe's design hub</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">{t("language")}</label>
            <select
              id="language-select"
              value={i18n.resolvedLanguage}
              onChange={(event) => void selectLanguage(event.target.value)}
              className="h-10 rounded-full border border-border bg-elevated px-3 text-xs font-medium text-foreground outline-none transition-colors hover:border-accent"
            >
              {languages.map((language) => <option key={language} value={language}>{language.toLowerCase()}</option>)}
            </select>
            <button
              onClick={() => setTheme(nextTheme)}
              aria-label={`${t("theme")}: ${t(nextTheme)}`}
              title={`${t("theme")}: ${t(nextTheme)}`}
              className="flex size-10 items-center justify-center rounded-full border border-border bg-elevated text-muted transition-colors hover:text-foreground"
            >
              <ThemeIcon size={17} />
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="surface-panel rounded-[1.75rem] p-3 md:hidden">
            <nav aria-label={t("mainNavigation")} className="space-y-1">{navLinks(true)}</nav>
            <div className="mt-3 border-t border-border pt-3">
              <SidebarInsights />
            </div>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="surface-panel min-h-[calc(100vh-6rem)] flex-1 rounded-[1.75rem] px-5 py-7 outline-none sm:px-8 sm:py-9 lg:px-10">
          <div className="mx-auto w-full max-w-[1320px]">
            <Suspense fallback={<div className="py-20" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
