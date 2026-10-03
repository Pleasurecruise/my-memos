import { defineConfig } from "vite-plus";

export default defineConfig({
  run: {
    cache: true,
  },
  test: {
    environment: "node",
    include: ["packages/**/__tests__/*.test.ts", "apps/memos/src/__tests__/*.test.ts"],
  },
  lint: {
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**", "**/.svelte-check/**"],
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**", "**/.svelte-check/**"],
    svelte: true,
  },
});
