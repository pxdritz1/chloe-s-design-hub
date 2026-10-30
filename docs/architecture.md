# Architecture notes

## First milestone

The application shell uses React, Vite and strict TypeScript. React Router handles client-side navigation. Tailwind CSS v4 provides utility styling and CSS-variable design tokens. Zustand persists the small set of user preferences; i18next handles English, Brazilian Portuguese and Spanish.

## Local-first direction

Creative file processing should remain in the browser whenever practical. IndexedDB (likely through Dexie) is the planned store for larger user data and Blobs; LocalStorage is reserved for lightweight preferences. Browser storage is not a backup and may be cleared by the user or browser. Export/import will be considered for portability.

## Planned boundaries

Each creative tool will live in its own feature module. Expensive operations can move to Web Workers; Comlink may be added when typed worker messaging earns its dependency. Large ML models should load only when a user opens a feature that needs them.

## Security and quality

Validate imported file types and sizes, sanitize SVG input, avoid unsafe HTML injection, revoke object URLs, and audit dependency and asset licenses. Unit/integration tests and browser-level E2E tests will be added alongside meaningful feature behavior.
