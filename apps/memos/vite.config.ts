import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type Plugin } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { voidPlugin } from "void";

function cloudflareWorkersShim(): Plugin {
  const voidExternal = /^cloudflare:/.source;
  return {
    name: "memos:cloudflare-workers-shim",
    enforce: "post",
    config(config) {
      for (const options of [config.build?.rollupOptions, config.build?.rolldownOptions]) {
        if (!options || !Array.isArray(options.external)) continue;
        options.external = options.external.map((pattern) =>
          pattern instanceof RegExp && pattern.source === voidExternal
            ? /^cloudflare:(?!workers$)/
            : pattern,
        );
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  envDir: command === "build" ? ".void/build-env" : ".",
  plugins: [
    voidPlugin(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ config: "./wrangler.json" }),
    }),
    tailwindcss(),
    cloudflareWorkersShim(),
  ],
  server: { allowedHosts: true },
  build: { rolldownOptions: { external: [/\.wasm$/] } },
  ssr: {
    target: "webworker",
    resolve: {
      conditions: ["workerd", "node"],
    },
  },
}));
