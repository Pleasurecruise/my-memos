import { createBundledHighlighter } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import githubLight from "shiki/dist/themes/github-light.mjs";
import githubDark from "shiki/dist/themes/github-dark.mjs";

import javascript from "shiki/dist/langs/javascript.mjs";
import typescript from "shiki/dist/langs/typescript.mjs";
import json from "shiki/dist/langs/json.mjs";
import html from "shiki/dist/langs/html.mjs";
import css from "shiki/dist/langs/css.mjs";
import shellscript from "shiki/dist/langs/shellscript.mjs";
import yaml from "shiki/dist/langs/yaml.mjs";
import markdown from "shiki/dist/langs/markdown.mjs";
import sql from "shiki/dist/langs/sql.mjs";
import svelte from "shiki/dist/langs/svelte.mjs";

const bundledLanguages = {
  javascript,
  js: javascript,
  typescript,
  ts: typescript,
  json,
  html,
  css,
  shellscript,
  bash: shellscript,
  sh: shellscript,
  shell: shellscript,
  yaml,
  yml: yaml,
  markdown,
  md: markdown,
  sql,
  svelte,
};

const bundledThemes = {
  "github-light": githubLight,
  "github-dark": githubDark,
};

const createContentHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: bundledThemes,
  engine: () => createJavaScriptRegexEngine(),
});

let highlighterPromise: ReturnType<typeof createContentHighlighter> | null = null;

export async function getHighlighter() {
  highlighterPromise ??= createContentHighlighter({
    langs: [],
    themes: ["github-light", "github-dark"],
  });
  return highlighterPromise;
}
