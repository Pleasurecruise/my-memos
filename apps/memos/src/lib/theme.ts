import { applyTheme } from "@my-memos/ui";

const STORAGE_KEY = "my-memos:theme";

export function loadTheme(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY);
  const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(dark);
  return dark;
}

export function persistTheme(dark: boolean): void {
  applyTheme(dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
}
