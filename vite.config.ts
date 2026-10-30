import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
 const { BASE_PATH } = loadEnv(mode, ".", "");
 return { base: BASE_PATH || "/", plugins: [react(), tailwindcss()] };
});
