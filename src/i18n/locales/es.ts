import type { Translation } from "./en";

export const es: Translation = {
  tagline: "un pequeño espacio para crear.",
  greeting: "haz espacio para las ideas.",
  intro: "una colección tranquila de pequeñas herramientas para tu flujo creativo.",
  allTools: "todas las herramientas", workspace: "espacio de trabajo",
  pickTool: "elige una herramienta y crea algo tuyo.", toolCount: "{{count}} herramientas por explorar",
  local: "local desde el diseño", localDescription: "tus archivos permanecen en el navegador. no se suben por defecto.",
  coming: "esta herramienta forma parte de la hoja de ruta.",
  comingDescription: "el espacio de trabajo está en preparación. no se simula ninguna funcionalidad.",
  back: "volver al panel", menu: "menú", theme: "tema", language: "idioma",
  light: "claro", dark: "oscuro", system: "sistema",
  category: { image: "imagen", color: "color", vector: "vector", type: "tipografía" },
  colorTools: {
    pick: "elegir color", input: "valor del color",
    invalid: "no pude leer ese color. prueba hex, rgb(), hsl() u oklch.",
    formats: "formatos", copy: "copiar", copied: "copiado", harmony: "armonía", scale: "escala de tonos",
    harmonies: { analogous: "análogos", complementary: "complementarios", triadic: "triada", split: "complementario dividido", tetradic: "tetrada" }
  },
  backgroundRemover: {
    upload: "elegir imagen", hint: "selecciona el color del fondo haciendo clic en la imagen.",
    tolerance: "tolerancia", softness: "suavidad del borde", reset: "empezar de nuevo",
    download: "descargar png", empty: "tu imagen aparecerá aquí", sample: "color seleccionado",
    note: "eliminación por color: funciona mejor con fondos uniformes."
  },
  colorMatrix: {
    upload: "elegir imagen", target: "color para reemplazar", replacement: "nuevo color",
    tolerance: "tolerancia", saturation: "saturación", invert: "invertir colores",
    download: "descargar png", empty: "elige una imagen para empezar", reset: "restablecer ajustes"
  },
  wallpaperStudio: {
    size: "formato", palette: "paleta", style: "composición", generate: "generar composición",
    download: "descargar fondo", square: "cuadrado", desktop: "escritorio", phone: "móvil",
    organic: "orgánica", geometric: "geométrica", minimal: "minimalista"
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
