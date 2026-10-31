import { useEffect } from "react";

export function useFavicon(href: string | null) {
  useEffect(() => {
    if (!href) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;

    const originalHref = link.getAttribute("href");
    const originalType = link.getAttribute("type");
    link.removeAttribute("type");
    link.setAttribute("href", href);

    return () => {
      if (originalHref) link.setAttribute("href", originalHref);
      if (originalType) link.setAttribute("type", originalType);
    };
  }, [href]);
}
