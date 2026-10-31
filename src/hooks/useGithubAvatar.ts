import { useEffect, useState } from "react";
import { githubUser } from "../config/site";

const cacheKey = "chloe-design-hub-github-avatar";
const maxAge = 24 * 60 * 60 * 1000;
const avatarHost = "avatars.githubusercontent.com";

interface CachedAvatar {
  url: string;
  savedAt: number;
}

function parseAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === avatarHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function readCache(): CachedAvatar | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { url, savedAt } = data as Partial<CachedAvatar>;
    const safeUrl = parseAvatarUrl(url);
    return safeUrl && typeof savedAt === "number" ? { url: safeUrl, savedAt } : null;
  } catch {
    return null;
  }
}

function writeCache(url: string) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ url, savedAt: Date.now() }));
  } catch {
    return;
  }
}

function withSize(url: string) {
  const sized = new URL(url);
  sized.searchParams.set("s", "96");
  return sized.toString();
}

export function useGithubAvatar() {
  const [avatar, setAvatar] = useState<string | null>(() => readCache()?.url ?? null);

  useEffect(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.savedAt < maxAge) return;

    const controller = new AbortController();

    fetch(`https://api.github.com/users/${githubUser}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: unknown) => {
        const url = typeof data === "object" && data !== null && "avatar_url" in data ? parseAvatarUrl(data.avatar_url) : null;
        if (!url) return;
        setAvatar(url);
        writeCache(url);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  return avatar ? withSize(avatar) : null;
}
