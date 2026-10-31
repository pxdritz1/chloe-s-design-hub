import type { Translation } from "./en";

export const ptBR: Translation = {
  tagline: "um cantinho para criar.",
  greeting: "abra espaço para ideias.",
  intro: "uma coleção tranquila de pequenas ferramentas para seu fluxo criativo.",
  allTools: "todas as ferramentas",
  workspace: "espaço de trabalho",
  pickTool: "escolha uma ferramenta e crie algo seu.",
  toolCount: "{{count}} ferramentas para explorar",
  local: "local por princípio",
  localDescription: "seus arquivos ficam no navegador. nada é enviado por padrão.",
  coming: "esta ferramenta faz parte do planejamento.",
  comingDescription: "o espaço de trabalho está sendo preparado. nenhuma funcionalidade está sendo simulada.",
  back: "voltar ao início",
  menu: "menu",
  theme: "tema",
  language: "idioma",
  light: "claro",
  dark: "escuro",
  system: "sistema",
  category: {
    image: "imagem",
    color: "cor",
    vector: "vetor",
    type: "tipografia"
  },
  colorTools: {
    pick: "escolher cor",
    input: "valor da cor",
    invalid: "não consegui ler essa cor. tente hex, rgb(), hsl() ou oklch().",
    formats: "formatos",
    copy: "copiar",
    copied: "copiado",
    harmony: "harmonia",
    scale: "escala de tons",
    harmonies: {
      analogous: "análogas",
      complementary: "complementares",
      triadic: "tríade",
      split: "complementar dividida",
      tetradic: "tétrade"
    }
  },
  halftone: {
    settings: "ajustes",
    choose: "escolher imagem",
    drop: "ou solte uma aqui",
    hint: "png, jpg, webp ou gif. nada sai do seu navegador.",
    another: "escolher outra imagem",
    loading: "preparando imagem…",
    error: "não consegui abrir essa imagem.",
    scaled: "reduzida para {{size}}px no lado maior para ficar rápida.",
    preview: "prévia do halftone",
    size: "tamanho do ponto",
    angle: "ângulo",
    contrast: "contraste",
    shape: "forma",
    shapes: { circle: "círculo", square: "quadrado", line: "linha" },
    ink: "tinta",
    paper: "papel",
    transparent: "papel transparente",
    invert: "inverter",
    download: "baixar png"
  },
  tools: {
    halftone: { name: "criador de halftone", description: "transforme imagens em padrões expressivos de pontos." },
    wallpaper: { name: "estúdio de wallpapers", description: "crie wallpapers com formas, cores e texturas." },
    photocraft: { name: "photocraft", description: "um espaço direto para edições do dia a dia." },
    background: { name: "removedor de fundo", description: "prepare recortes usando processamento local." },
    converters: { name: "conversores de formato", description: "converta imagens entre png, jpg e webp e transforme vídeo em gif." },
    colors: { name: "ferramentas de cor", description: "explore, converta e crie paletas." },
    colorMatrix: { name: "matriz de cor", description: "troque cores exatas, inverta canais e ajuste a saturação." },
    accessibility: { name: "contraste e visão", description: "verifique contraste e simule diferenças de visão de cores." },
    svg: { name: "oficina svg", description: "crie, inspecione e otimize gráficos vetoriais." },
    typography: { name: "estúdio tipográfico", description: "compare fontes, crie escalas e teste combinações." }
  }
};
