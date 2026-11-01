import { isGenericFamily } from "./type";

export function isFontInstalled(family: string): boolean {
  const name = family.trim();
  if (!name || isGenericFamily(name)) return true;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return true;

  const sample = "mmmmmmmmmmlli";
  const measure = (stack: string) => {
    ctx.font = `72px ${stack}`;
    return ctx.measureText(sample).width;
  };
  const quoted = `"${name.replace(/["\\]/g, "")}"`;
  return measure(`${quoted}, monospace`) !== measure("monospace") || measure(`${quoted}, serif`) !== measure("serif");
}
