import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./apps/memos/src/lib", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/__tests__/*.test.ts", "apps/memos/src/__tests__/*.test.ts"],
  },
});
