import {
  Blend,
  CircleDot,
  Image,
  Palette,
  Repeat,
  ScanLine,
  Shapes,
  ShieldCheck,
  SlidersHorizontal,
  Type,
  type LucideIcon
} from "lucide-react";
import type { ComponentType } from "react";

export type ToolCategory = "image" | "color" | "vector" | "type";
export type ToolTone = "sage" | "clay" | "sand" | "lavender";

export interface Tool {
  id: string;
  key: string;
  category: ToolCategory;
  icon: LucideIcon;
  tone: ToolTone;
  load?: () => Promise<{ default: ComponentType }>;
}

export const tools: readonly Tool[] = [
  { id: "halftone", key: "halftone", category: "image", icon: CircleDot, tone: "clay" },
  { id: "wallpaper-studio", key: "wallpaper", category: "image", icon: Image, tone: "sage" },
  { id: "photocraft", key: "photocraft", category: "image", icon: Blend, tone: "sand" },
  { id: "background-remover", key: "background", category: "image", icon: ScanLine, tone: "lavender" },
  { id: "converters", key: "converters", category: "image", icon: Repeat, tone: "clay" },
  { id: "color-tools", key: "colors", category: "color", icon: Palette, tone: "sage" },
  { id: "color-matrix", key: "colorMatrix", category: "color", icon: SlidersHorizontal, tone: "sand" },
  { id: "accessibility", key: "accessibility", category: "color", icon: ShieldCheck, tone: "clay" },
  { id: "svg-tools", key: "svg", category: "vector", icon: Shapes, tone: "lavender" },
  { id: "typography", key: "typography", category: "type", icon: Type, tone: "sand" }
];

export const toneClasses: Record<ToolTone, string> = {
  sage: "bg-sage-soft text-accent",
  clay: "bg-clay-soft text-clay",
  lavender: "bg-lavender-soft text-lavender",
  sand: "bg-sand-soft text-sand-ink"
};
