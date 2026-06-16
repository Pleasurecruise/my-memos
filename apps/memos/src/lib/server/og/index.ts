import { Resvg, initWasm } from "@resvg/resvg-wasm";
import type { KVNamespace } from "@cloudflare/workers-types";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_BACKGROUND = "#faf7eb";

const palette = {
  paper: "#faf7eb",
  cloud: "#f5f2ec",
  oat: "#e8e0d0",
  fog: "#726e69",
  ink: "#1a1a1a",
} as const;

const brand = "#963c5a";

const fontFamily = {
  sans: '"Geist", "Inter", system-ui, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  serif: '"Lora", "Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  mono: '"Geist Mono", "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
} as const;

export interface OgImageOptions {
  title: string;
  tags?: string[];
  domain?: string;
  date?: string | null;
  siteName?: string;
}

interface TextOptions {
  x: number;
  y: number;
  family: string;
  size: number;
  weight: number;
  fill: string;
  opacity?: number;
  letterSpacing?: string;
  transform?: string;
  anchor?: "start" | "middle" | "end";
}

type OgLayout = ReturnType<typeof getLayout>;

let wasmReady: Promise<void> | null = null;

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/[#*_~[\]()>"<]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderOgImage(options: OgImageOptions): string {
  const {
    title,
    tags = [],
    domain = "my-memos.pages.dev",
    date = null,
    siteName = "My Memos",
  } = options;

  const layout = getLayout(wrapText(title, 900, 46, 4), tags.length > 0);
  const parts = [
    renderCard(layout),
    renderIdentity(layout, siteName),
    renderTitle(layout),
    renderTags(layout, tags),
    renderFooter(layout, domain, date),
  ];

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">`,
    renderBackground(),
    ...parts,
    `</svg>`,
  ].join("\n");
}

export async function renderOgPng(svg: string, kv: KVNamespace): Promise<ArrayBuffer> {
  await ensureWasm();

  const fontBuffers = await loadOgFonts(extractText(svg), kv);

  const resvg = new Resvg(svg, {
    background: OG_BACKGROUND,
    fitTo: { mode: "width", value: OG_WIDTH },
    font: {
      fontBuffers,
      defaultFontFamily: OG_FONT_FAMILIES.sans,
      sansSerifFamily: OG_FONT_FAMILIES.sans,
      serifFamily: OG_FONT_FAMILIES.serif,
    },
  });

  const image = resvg.render();
  try {
    const png = image.asPng();
    return new Uint8Array(png).buffer;
  } finally {
    image.free();
    resvg.free();
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractText(svg: string): string {
  let text = "";
  for (const match of svg.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)) {
    text += match[1];
  }
  return text;
}

function isWideChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    code >= 0x1f000
  );
}

function measureText(text: string, size: number): number {
  let width = 0;
  for (const ch of text) width += isWideChar(ch) ? size : size * 0.6;
  return width;
}

function wrapText(text: string, maxWidth: number, size: number, maxLines: number): string[] {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  const charWidth = (ch: string) => (isWideChar(ch) ? size : size * 0.6);

  const fill = (budget: number): string[] => {
    const lines: string[] = [];
    let line: string[] = [];
    let width = 0;

    for (const ch of chars) {
      if (width + charWidth(ch) > budget && line.length > 0) {
        const lastSpace = line.lastIndexOf(" ");
        const carried = lastSpace > 0 ? line.slice(lastSpace + 1) : [];
        lines.push(line.slice(0, lastSpace > 0 ? lastSpace : line.length).join(""));
        line = carried;
        width = line.reduce((sum, c) => sum + charWidth(c), 0);
      }
      line.push(ch);
      width += charWidth(ch);
    }

    if (line.length > 0) lines.push(line.join(""));
    return lines.length > 0 ? lines : [""];
  };

  let lines = fill(maxWidth);

  // Balance line lengths for short titles so they don't leave a lonely last line.
  if (lines.length >= 2 && lines.length <= maxLines) {
    let low = 0;
    let high = maxWidth;
    let best = lines;
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2;
      const candidate = fill(mid);
      if (candidate.length <= lines.length) {
        best = candidate;
        high = mid;
      } else {
        low = mid;
      }
    }
    lines = best;
  }

  // Truncate overflow with an ellipsis — the full memo body need not be shown.
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = Array.from(kept[maxLines - 1]);
    const budget = maxWidth - charWidth("…");
    let width = last.reduce((sum, c) => sum + charWidth(c), 0);
    while (last.length > 0 && width > budget) {
      width -= charWidth(last[last.length - 1]);
      last.pop();
    }
    kept[maxLines - 1] = last.join("").trimEnd() + "…";
    lines = kept;
  }

  return lines;
}

function textElement(text: string, options: TextOptions): string {
  const attrs = [
    `x="${options.x}"`,
    `y="${options.y}"`,
    `font-family="${options.family.replace(/"/g, "&quot;")}"`,
    `font-size="${options.size}"`,
    `font-weight="${options.weight}"`,
    `fill="${options.fill}"`,
    options.opacity != null ? `opacity="${options.opacity}"` : "",
    options.letterSpacing ? `letter-spacing="${options.letterSpacing}"` : "",
    options.transform ? `text-transform="${options.transform}"` : "",
    options.anchor ? `text-anchor="${options.anchor}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<text ${attrs}>${escapeXml(text)}</text>`;
}

function renderBackground(): string {
  return `
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${palette.paper}" />
    <defs>
      <radialGradient id="glow" cx="85%" cy="15%" r="55%">
        <stop offset="0%" stop-color="${brand}" stop-opacity="0.06" />
        <stop offset="100%" stop-color="${palette.paper}" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${palette.oat}" stroke-width="0.5" stroke-opacity="0.35" />
      </pattern>
    </defs>
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)" />
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#grid)" />
    <circle cx="1120" cy="560" r="3" fill="${brand}" opacity="0.15" />
    <circle cx="1136" cy="548" r="2" fill="${brand}" opacity="0.10" />
    <circle cx="1148" cy="564" r="2.5" fill="${brand}" opacity="0.12" />
    <rect x="0" y="0" width="180" height="3" fill="${brand}" />
  `;
}

function getLayout(lines: string[], hasTags: boolean) {
  const cardLeft = 120;
  const cardRight = 1080;
  const cardTop = 70;
  const cardBottom = 560;
  const idY = 120;
  const footerY = 542;
  const footerSeparatorY = 526;

  const contentLineHeight = 58;
  const contentHeight = contentLineHeight * lines.length;
  const tagHeight = hasTags ? 44 : 0;
  const blockHeight = contentHeight + tagHeight;

  const availableTop = idY + 44;
  const availableBottom = footerSeparatorY - 16;
  const availableHeight = availableBottom - availableTop;

  return {
    lines,
    cardLeft,
    cardRight,
    cardTop,
    cardBottom,
    idY,
    footerY,
    footerSeparatorY,
    contentLineHeight,
    contentHeight,
    blockY: availableTop + Math.max(0, (availableHeight - blockHeight) / 2),
    barTop: idY - 28,
    barHeight: footerSeparatorY - (idY - 28),
  };
}

function renderCard(layout: OgLayout): string {
  return `
    <rect x="${layout.cardLeft}" y="${layout.cardTop}" width="${layout.cardRight - layout.cardLeft}" height="${layout.cardBottom - layout.cardTop}" rx="10" fill="${palette.cloud}" stroke="${palette.oat}" stroke-width="1" />
    <defs>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${brand}" />
        <stop offset="100%" stop-color="${brand}" stop-opacity="0.12" />
      </linearGradient>
    </defs>
    <rect x="${layout.cardLeft + 16}" y="${layout.barTop}" width="3" height="${layout.barHeight}" rx="1.5" fill="url(#bar)" />
  `;
}

function renderIdentity(layout: OgLayout, siteName: string): string {
  const iconX = layout.cardLeft + 42;
  const iconY = layout.idY - 8;

  return `
    <circle cx="${iconX}" cy="${iconY}" r="14" fill="${brand}" fill-opacity="0.12" stroke="${brand}" stroke-opacity="0.28" />
    ${textElement("M", { x: iconX, y: layout.idY - 1, family: fontFamily.serif, size: 15, weight: 600, fill: brand, anchor: "middle" })}
    ${textElement(siteName.toUpperCase(), { x: layout.cardLeft + 64, y: layout.idY, family: fontFamily.sans, size: 15, weight: 600, fill: brand, letterSpacing: "0.14em" })}
  `;
}

function renderTitle(layout: OgLayout): string {
  return layout.lines
    .map((line, i) =>
      textElement(line, {
        x: layout.cardLeft + 30,
        y: layout.blockY + i * layout.contentLineHeight,
        family: fontFamily.sans,
        size: 46,
        weight: 500,
        fill: palette.ink,
      }),
    )
    .join("\n");
}

function renderTags(layout: OgLayout, tags: string[]): string {
  if (tags.length === 0) return "";

  const tagY = layout.blockY + layout.contentHeight + 24;
  const maxX = layout.cardRight - 20;
  let x = layout.cardLeft + 30;
  const out: string[] = [];

  for (const tag of tags.slice(0, 5)) {
    const label = `# ${tag}`;
    const width = measureText(label, 13) + 28;
    if (out.length > 0 && x + width > maxX) break;
    out.push(`
      <rect x="${x}" y="${tagY - 18}" width="${width}" height="28" rx="14" fill="${brand}" fill-opacity="0.10" stroke="${brand}" stroke-opacity="0.20" stroke-width="1" />
      ${textElement(label, { x: x + 14, y: tagY, family: fontFamily.mono, size: 13, weight: 500, fill: brand })}
    `);
    x += width + 8;
  }

  return out.join("\n");
}

function renderFooter(layout: OgLayout, domain: string, date: string | null): string {
  const parts = [
    `<line x1="${layout.cardLeft + 20}" y1="${layout.footerSeparatorY}" x2="${layout.cardRight}" y2="${layout.footerSeparatorY}" stroke="${palette.oat}" stroke-width="1" />`,
    textElement(domain, {
      x: layout.cardLeft + 20,
      y: layout.footerY,
      family: fontFamily.mono,
      size: 13,
      weight: 400,
      fill: palette.fog,
      opacity: 0.6,
      letterSpacing: "0.05em",
      transform: "uppercase",
    }),
  ];

  if (date) {
    parts.push(
      textElement(date, {
        x: layout.cardRight,
        y: layout.footerY,
        family: fontFamily.mono,
        size: 13,
        weight: 400,
        fill: palette.fog,
        opacity: 0.5,
        anchor: "end",
      }),
    );
  }

  return parts.join("\n");
}

async function ensureWasm() {
  wasmReady ??= (async () => {
    const { default: wasmModule } = await import("@resvg/resvg-wasm/index_bg.wasm");
    await initWasm(wasmModule);
  })().catch((err) => {
    wasmReady = null;
    throw err;
  });
  await wasmReady;
}
