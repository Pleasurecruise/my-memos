import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    cache: true,
  },
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./apps/memos/src/lib", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/__tests__/*.test.ts", "apps/memos/src/__tests__/*.test.ts"],
  },
  lint: {
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**"],
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**"],
    svelte: true,
  },
});
