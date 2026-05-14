import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  root: "dev",
  server: {
    port: 6006,
    strictPort: true,
  },
  build: {
    outDir: "../dist",
  },
});
