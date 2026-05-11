import { defineConfig } from "vite-plus";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  lint: {
    ignorePatterns: ["dist/**"],
  },
  fmt: {
    indent: "tab",
    ignorePatterns: ["dist/**"],
  },
  plugins: [cloudflare()],
});
