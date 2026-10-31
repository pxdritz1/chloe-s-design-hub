export const en = {
  tagline: "a little space for creative work.",
  greeting: "make room for ideas.",
  intro: "a calm collection of small tools for your creative workflow.",
  allTools: "all tools", workspace: "workspace", pickTool: "pick a tool and make something yours.",
  toolCount: "{{count}} tools to explore", local: "local-first by design",
  localDescription: "your files stay in your browser. nothing is uploaded by default.",
  coming: "this tool is part of the roadmap.",
  comingDescription: "the workspace is being prepared. no functionality is being simulated here.",
  back: "back to dashboard", menu: "menu", theme: "theme", language: "language",
  light: "light", dark: "dark", system: "system",
  category: { image: "image", color: "color", vector: "vector", type: "typography" },
  colorTools: {
    pick: "pick a color", input: "color value",
    invalid: "couldn't read that color. try hex, rgb(), hsl() or oklch().",
    formats: "formats", copy: "copy", copied: "copied", harmony: "harmony", scale: "tone scale",
    harmonies: { analogous: "analogous", complementary: "complementary", triadic: "triadic", split: "split", tetradic: "tetradic" }
  },
  backgroundRemover: {
    upload: "choose image", hint: "select the background color by clicking the image.",
    tolerance: "tolerance", softness: "edge softness", reset: "start over",
    download: "download png", empty: "your image will appear here", sample: "selected color",
    note: "color-based removal: works best with uniform backgrounds."
  },
  colorMatrix: {
    upload: "choose image", target: "color to replace", replacement: "new color",
    tolerance: "tolerance", saturation: "saturation", invert: "invert colors",
    download: "download png", empty: "choose an image to get started", reset: "reset adjustments"
  },
  wallpaperStudio: {
    size: "format", palette: "palette", style: "composition", generate: "generate composition",
    download: "download wallpaper", square: "square", desktop: "desktop", phone: "phone",
    organic: "organic", geometric: "geometric", minimal: "minimal"
  },
  tools: {
    halftone: { name: "halftone creator", description: "turn images into expressive dot patterns." },
    wallpaper: { name: "wallpaper studio", description: "compose wallpapers with shapes, color and texture." },
    photocraft: { name: "photocraft", description: "a focused workspace for everyday image edits." },
    background: { name: "background remover", description: "prepare clean cutouts with local processing." },
    converters: { name: "format converters", description: "convert images between png, jpg and webp, and turn video into gif." },
    colors: { name: "color tools", description: "explore, convert and build thoughtful palettes." },
    colorMatrix: { name: "color matrix", description: "swap exact colors, invert channels and fine-tune saturation." },
    accessibility: { name: "contrast & vision", description: "check contrast and preview color-vision differences." },
    svg: { name: "svg workshop", description: "create, inspect and optimize vector graphics." },
    typography: { name: "typography studio", description: "compare type, build scales and test pairings." }
  }
};

export type Translation = typeof en;
