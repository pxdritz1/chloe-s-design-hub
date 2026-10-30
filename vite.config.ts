import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const vendorChunks: [RegExp, string][] = [
  [/node_modules\/(react|react-dom|scheduler)\//, "react"],
  [/node_modules\/(react-router|react-router-dom)\//, "router"],
  [/node_modules\/(i18next|react-i18next)\//, "i18n"]
];

export default defineConfig(({ mode }) => {
  const { BASE_PATH } = loadEnv(mode, ".", "");

  return {
    base: BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            return vendorChunks.find(([pattern]) => pattern.test(id))?.[1];
          }
        }
      }
    }
  };
});
