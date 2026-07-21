import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { withVoidTSConfig } from "void/sveltekit";

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      config: "./wrangler.jsonc",
    }),
    typescript: {
      config: withVoidTSConfig(),
    },
  },
};
