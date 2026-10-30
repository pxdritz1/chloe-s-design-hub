# chloe's design hub

A calm, local-first collection of creative tools for color, image, vector and typography workflows.

**Status:** early development  
**License:** Apache License 2.0

## Getting started

Requirements: Node.js 20.19+ (22 recommended) and npm 10+.

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the development server
- `npm run typecheck` — run TypeScript checks
- `npm run build` — type-check and create a production build
- `npm run preview` — preview the production build

## Deployment

Pull requests and pushes to `main` run type-checking and a production build (`.github/workflows/ci.yml`). Pushes to `main` also publish to GitHub Pages (`.github/workflows/deploy.yml`). In the repository settings, Pages must use **GitHub Actions** as its source.

The Vite `base` comes from the `BASE_PATH` environment variable and defaults to `/`. The deploy workflow fills it in from GitHub Pages, so a project URL and a custom domain both work. `404.html` is a copy of `index.html`, which lets deep links reach the client-side router.

## Principles

- **Local-first:** process creative files in the browser whenever practical.
- **Privacy-first:** user files are not uploaded by default.
- **Modular:** each tool owns its domain logic and UI.
- **Accessible:** keyboard support, contrast and semantic UI are foundational.
- **Open source:** licensed under Apache-2.0.

The initial milestone establishes the app shell, responsive navigation, design tokens, theme preferences and internationalization. Dashboard entries are roadmap navigation, not claims that the tools are implemented.

See [LICENSE](./LICENSE).
