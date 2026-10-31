import type { Translation } from "./en";

export const es: Translation = {
  tagline: "un pequeño espacio para crear.",
  greeting: "haz espacio para las ideas.",
  intro: "una colección tranquila de pequeñas herramientas para tu flujo creativo.",
  allTools: "todas las herramientas",
  workspace: "espacio de trabajo",
  pickTool: "elige una herramienta y crea algo tuyo.",
  toolCount: "{{count}} herramientas por explorar",
  local: "local desde el diseño",
  localDescription: "tus archivos permanecen en el navegador. no se suben por defecto.",
  coming: "esta herramienta forma parte de la hoja de ruta.",
  comingDescription: "el espacio de trabajo está en preparación. no se simula ninguna funcionalidad.",
  back: "volver al panel",
  menu: "menú",
  theme: "tema",
  language: "idioma",
  light: "claro",
  dark: "oscuro",
  system: "sistema",
  category: {
    image: "imagen",
    color: "color",
    vector: "vector",
    type: "tipografía"
  },
  colorTools: {
    pick: "elegir color",
    input: "valor del color",
    invalid: "no pude leer ese color. prueba hex, rgb(), hsl() u oklch().",
    formats: "formatos",
    copy: "copiar",
    copied: "copiado",
    harmony: "armonía",
    scale: "escala de tonos",
    harmonies: {
      analogous: "análogos",
      complementary: "complementarios",
      triadic: "triada",
      split: "complementario dividido",
      tetradic: "tetrada"
    }
  },
  halftone: {
    settings: "ajustes",
    choose: "elegir imagen",
    drop: "o suelta una aquí",
    hint: "png, jpg, webp o gif. nunca sale de tu navegador.",
    another: "elegir otra imagen",
    loading: "preparando imagen…",
    error: "no pude abrir esa imagen.",
    scaled: "reducida a {{size}}px en el lado mayor para ir más rápido.",
    preview: "vista previa del halftone",
    size: "tamaño del punto",
    angle: "ángulo",
    contrast: "contraste",
    shape: "forma",
    shapes: { circle: "círculo", square: "cuadrado", line: "línea" },
    ink: "tinta",
    paper: "papel",
    transparent: "papel transparente",
    invert: "invertir",
    download: "descargar png"
  },
  tools: {
    halftone: { name: "creador de semitonos", description: "convierte imágenes en patrones expresivos de puntos." },
    wallpaper: { name: "estudio de fondos", description: "compón fondos con formas, color y textura." },
    photocraft: { name: "photocraft", description: "un espacio sencillo para editar imágenes." },
    background: { name: "quitar fondo", description: "prepara recortes con procesamiento local." },
    converters: { name: "conversores de formato", description: "convierte imágenes entre png, jpg y webp y transforma vídeo en gif." },
    colors: { name: "herramientas de color", description: "explora, convierte y crea paletas." },
    colorMatrix: { name: "matriz de color", description: "cambia colores exactos, invierte canales y ajusta la saturación." },
    accessibility: { name: "contraste y visión", description: "comprueba el contraste y previsualiza diferencias de visión del color." },
    svg: { name: "taller svg", description: "crea, inspecciona y optimiza gráficos vectoriales." },
    typography: { name: "estudio tipográfico", description: "compara fuentes, crea escalas y prueba combinaciones." }
  }
};
