import { z } from "zod";
import { decode } from "entities";

type Mermaid = typeof import("mermaid").default;

type MermaidRender = (
  diagramId: string,
  diagramCode: string,
  renderContainer?: HTMLElement,
) => Promise<{ svg: string }>;

export interface MermaidRenderResult {
  svg: string | null;
  error: string | null;
}

export type MermaidSpec = z.infer<typeof renderMermaidSchema>;

export const renderMermaidSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .describe("Short diagram title. Use sentence case, not a filename."),
  code: z
    .string()
    .min(1)
    .max(12_000)
    .describe(
      "Raw Mermaid source only. Do not wrap in markdown fences. Keep diagrams compact: short labels, shallow subgraphs, and no theme/init directives.",
    ),
  caption: z
    .string()
    .max(240)
    .optional()
    .describe(
      "Optional one-sentence caption. Put explanatory prose in your normal assistant response, not here.",
    ),
});

const MERMAID_RENDER_TIMEOUT_MS = 15_000;

let mermaidModulePromise: Promise<Mermaid> | null = null;
let mermaidInitialized = false;
let renderQueue = Promise.resolve();

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (ms <= 0) return promise;
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Mermaid ${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function removeMermaidArtifacts(diagramId: string) {
  if (typeof document === "undefined") return;
  document.getElementById(diagramId)?.remove();
  document.getElementById(`d${diagramId}`)?.remove();
  document.querySelectorAll(".mermaidTooltip").forEach((node) => node.remove());
}

function createOffscreenRenderHost() {
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  Object.assign(container.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(container);
  return container;
}

function readThemeColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function getMermaidThemeVariables() {
  return {
    primaryColor: readThemeColor("--color-background"),
    primaryTextColor: readThemeColor("--color-foreground"),
    primaryBorderColor: readThemeColor("--color-border-strong"),
    lineColor: readThemeColor("--color-foreground"),
    secondaryColor: readThemeColor("--color-muted"),
    tertiaryColor: readThemeColor("--color-background"),
  };
}

async function loadMermaid(): Promise<Mermaid> {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid")
      .then((module) => {
        const mermaid = module.default;
        mermaid.setParseErrorHandler(() => {});
        return mermaid;
      })
      .catch((err) => {
        mermaidModulePromise = null;
        mermaidInitialized = false;
        throw err;
      });
  }
  const mermaid = await withTimeout(mermaidModulePromise, MERMAID_RENDER_TIMEOUT_MS, "module load");
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      htmlLabels: false,
      theme: "base",
      themeVariables: getMermaidThemeVariables(),
    });
    mermaidInitialized = true;
  }
  return mermaid;
}

function queuedRender(mermaid: Mermaid, diagramId: string, code: string) {
  const render = renderQueue.then(() => {
    const container = createOffscreenRenderHost();
    const renderDiagram = mermaid.render as MermaidRender;
    removeMermaidArtifacts(diagramId);
    return withTimeout(
      renderDiagram(diagramId, code, container).finally(() => {
        container.remove();
        removeMermaidArtifacts(diagramId);
      }),
      MERMAID_RENDER_TIMEOUT_MS,
      "render",
    );
  });
  renderQueue = render.then(
    () => {},
    () => {},
  );
  return render;
}

export function stripMermaidFences(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/^\uFEFF/, "")
    .replace(/^```mermaid\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

export function normalizeMermaidCode(raw: string): string {
  return decode(stripMermaidFences(raw));
}

export async function renderMermaidCode(raw: string): Promise<MermaidRenderResult> {
  const code = normalizeMermaidCode(raw);
  if (!code) return { svg: null, error: "Diagram code is empty." };

  const id = "mermaid-" + Math.random().toString(36).slice(2, 10);

  try {
    const mermaid = await loadMermaid();
    const { svg: rawSvg } = await queuedRender(mermaid, id, code);
    const svg = rawSvg && rawSvg.trim().startsWith("<svg") ? rawSvg : null;
    if (!svg) {
      return { svg: null, error: "Mermaid returned an empty or invalid SVG." };
    }
    return { svg, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { svg: null, error: message || "Unknown Mermaid rendering error." };
  }
}
