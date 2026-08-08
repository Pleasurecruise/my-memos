import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { OG_FONT_FAMILIES, loadOgFonts } from "./fonts";
import logoDataUri from "../../../../static/favicon.png?inline";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_BACKGROUND = "#faf7eb";

const palette = {
  paper: "#faf7eb",
  cloud: "#f5f2ec",
  oat: "#e8e0d0",
  sand: "#d4c5a9",
  fog: "#726e69",
  ink: "#1a1a1a",
  accent: "#963c5a",
} as const;

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

  const layout = getLayout(wrapText(title, 880, 46, 4), tags.length > 0);
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
    options.anchor ? `text-anchor="${options.anchor}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<text ${attrs}>${escapeXml(text)}</text>`;
}

function renderBackground(): string {
  return `
    <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${palette.oat}" />
    <circle cx="1118" cy="68" r="30" fill="none" stroke="${palette.sand}" stroke-width="1" />
    <circle cx="1118" cy="68" r="4" fill="${palette.accent}" />
  `;
}

function getLayout(lines: string[], hasTags: boolean) {
  const cardLeft = 56;
  const cardRight = 1144;
  const cardTop = 48;
  const cardBottom = 582;
  const contentLeft = 112;
  const contentRight = 1088;
  const contentLineHeight = 60;
  const contentHeight = contentLineHeight * lines.length;
  const availableTop = 205;
  const availableBottom = hasTags ? 444 : 478;
  const availableHeight = availableBottom - availableTop;

  return {
    lines,
    cardLeft,
    cardRight,
    cardTop,
    cardBottom,
    contentLeft,
    contentRight,
    contentLineHeight,
    contentHeight,
    blockY: availableTop + Math.max(0, (availableHeight - contentHeight) / 2),
    tagsY: 474,
    footerTop: 510,
    footerY: 550,
  };
}

function renderCard(layout: OgLayout): string {
  return `
    <rect x="${layout.cardLeft}" y="${layout.cardTop}" width="${layout.cardRight - layout.cardLeft}" height="${layout.cardBottom - layout.cardTop}" rx="10" fill="${palette.paper}" stroke="${palette.sand}" stroke-width="1" />
    <path d="M ${layout.cardLeft + 10} ${layout.cardTop} H ${layout.cardLeft + 206}" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round" />
  `;
}

function renderIdentity(layout: OgLayout, siteName: string): string {
  const markLeft = layout.contentLeft;
  const markTop = 86;
  const markSize = 52;

  return `
    <defs>
      <clipPath id="site-mark-clip">
        <rect x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" rx="5" />
      </clipPath>
    </defs>
    <image href="${logoDataUri}" x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#site-mark-clip)" />
    <rect x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" rx="5" fill="none" stroke="${palette.sand}" stroke-width="1" />
    ${textElement(siteName.toUpperCase(), { x: markLeft + 72, y: 111, family: fontFamily.sans, size: 17, weight: 600, fill: palette.ink, letterSpacing: "0.12em" })}
    ${textElement("PERSONAL MEMO", { x: markLeft + 72, y: 133, family: fontFamily.mono, size: 11, weight: 500, fill: palette.fog, letterSpacing: "0.14em" })}
    <line x1="${layout.contentLeft}" y1="166" x2="${layout.contentRight}" y2="166" stroke="${palette.oat}" stroke-width="1" />
    ${textElement("MEMO / 备忘", { x: layout.contentRight, y: 116, family: fontFamily.sans, size: 13, weight: 500, fill: palette.fog, letterSpacing: "0.08em", anchor: "end" })}
  `;
}

function renderTitle(layout: OgLayout): string {
  return layout.lines
    .map((line, i) =>
      textElement(line, {
        x: layout.contentLeft,
        y: layout.blockY + i * layout.contentLineHeight,
        family: fontFamily.serif,
        size: 46,
        weight: 600,
        fill: palette.ink,
        letterSpacing: "-0.02em",
      }),
    )
    .join("\n");
}

function renderTags(layout: OgLayout, tags: string[]): string {
  if (tags.length === 0) return "";

  const output: string[] = [];
  let x = layout.contentLeft;
  for (const tag of tags.slice(0, 5)) {
    const label = `#${tag}`;
    const width = measureText(label, 13) + 26;
    if (x + width > layout.contentRight) break;
    output.push(`
      <rect x="${x}" y="${layout.tagsY - 20}" width="${width}" height="30" rx="15" fill="${palette.cloud}" stroke="${palette.oat}" stroke-width="1" />
      ${textElement(label, { x: x + 13, y: layout.tagsY, family: fontFamily.mono, size: 13, weight: 500, fill: palette.accent })}
    `);
    x += width + 10;
  }

  return output.join("\n");
}

function renderFooter(layout: OgLayout, domain: string, date: string | null): string {
  const meta = date ?? "A WARM, MINIMAL MEMO SPACE";

  return `
    <rect x="${layout.cardLeft}" y="${layout.footerTop}" width="${layout.cardRight - layout.cardLeft}" height="${layout.cardBottom - layout.footerTop}" rx="10" fill="${palette.cloud}" />
    <rect x="${layout.cardLeft}" y="${layout.footerTop}" width="${layout.cardRight - layout.cardLeft}" height="10" fill="${palette.cloud}" />
    <line x1="${layout.cardLeft}" y1="${layout.footerTop}" x2="${layout.cardRight}" y2="${layout.footerTop}" stroke="${palette.oat}" stroke-width="1" />
    ${textElement(domain.toUpperCase(), { x: layout.contentLeft, y: layout.footerY, family: fontFamily.sans, size: 15, weight: 600, fill: palette.ink, letterSpacing: "0.10em" })}
    ${textElement(meta, { x: layout.contentRight, y: layout.footerY, family: fontFamily.mono, size: 12, weight: 400, fill: palette.fog, letterSpacing: "0.06em", anchor: "end" })}
  `;
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
