import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**"],
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["CLAUDE.md", "dist/**", "apps/memos/.svelte-kit/**"],
    svelte: true,
  },
});
