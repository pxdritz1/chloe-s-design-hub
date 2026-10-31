import { describe, expect, it } from "vitest";
import { en, type Translation } from "../i18n/locales/en";
import { es } from "../i18n/locales/es";
import { ptBR } from "../i18n/locales/pt-BR";
import { tools } from "./tools";

const locales: [string, Translation][] = [
  ["en", en],
  ["es", es],
  ["pt-BR", ptBR]
];

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(collectStrings);
  return [];
}

describe("tool registry", () => {
  it("has unique ids and keys", () => {
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.key)).size).toBe(tools.length);
  });

  it.each(locales)("has copy for every tool and category in %s", (_, locale) => {
    for (const tool of tools) {
      expect(locale.tools).toHaveProperty(tool.key);
      expect(locale.category).toHaveProperty(tool.category);
    }
  });
});

describe("locales", () => {
  it.each(locales)("keeps all copy lowercase in %s", (name, locale) => {
    const offenders = collectStrings(locale).filter((text) => text !== text.toLocaleLowerCase(name));
    expect(offenders).toEqual([]);
  });
});
