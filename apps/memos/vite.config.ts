import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
});
