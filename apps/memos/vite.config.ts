import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { voidPlugin } from "void";

export default defineConfig(({ command }) => ({
  envDir: command === "build" ? ".void/build-env" : ".",
  plugins: [voidPlugin(), sveltekit(), tailwindcss()],
  server: {
    allowedHosts: true,
  },
  build: {
    rolldownOptions: {
      external: [/\.wasm$/],
    },
  },
}));
