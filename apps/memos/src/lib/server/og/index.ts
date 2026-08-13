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

  const titleSize = getTitleSize(title);
  const layout = getLayout(wrapText(title, 900, titleSize, 4), titleSize, tags.length > 0);
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

function getTitleSize(title: string): number {
  const length = Array.from(title.trim()).length;
  if (length <= 16) return 64;
  if (length <= 30) return 58;
  if (length <= 50) return 52;
  return 46;
}

function getLayout(lines: string[], titleSize: number, hasTags: boolean) {
  const cardLeft = 56;
  const cardRight = 1144;
  const cardTop = 48;
  const cardBottom = 582;
  const contentLeft = 112;
  const titleLeft = 136;
  const contentRight = 1088;
  const contentLineHeight = Math.round(titleSize * 1.08);
  const contentHeight = titleSize + contentLineHeight * (lines.length - 1);
  const availableTop = 202;
  const availableBottom = hasTags ? 444 : 478;
  const availableHeight = availableBottom - availableTop;

  return {
    lines,
    titleSize,
    cardLeft,
    cardRight,
    cardTop,
    cardBottom,
    contentLeft,
    titleLeft,
    contentRight,
    contentLineHeight,
    blockY: availableTop + Math.max(0, (availableHeight - contentHeight) / 2) + titleSize * 0.82,
    tagsY: 488,
    footerY: 558,
  };
}

function renderCard(layout: OgLayout): string {
  return `
    <rect x="${layout.cardLeft}" y="${layout.cardTop}" width="${layout.cardRight - layout.cardLeft}" height="${layout.cardBottom - layout.cardTop}" rx="10" fill="${palette.paper}" stroke="${palette.sand}" stroke-width="1" />
    <path d="M ${layout.cardLeft + 10} ${layout.cardTop} H ${layout.cardLeft + 186}" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round" />
  `;
}

function renderIdentity(layout: OgLayout, siteName: string): string {
  const markLeft = layout.contentLeft;
  const markTop = 84;
  const markSize = 50;

  return `
    <defs>
      <clipPath id="site-mark-clip">
        <rect x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" rx="5" />
      </clipPath>
    </defs>
    <image href="${logoDataUri}" x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" preserveAspectRatio="xMidYMid slice" clip-path="url(#site-mark-clip)" />
    <rect x="${markLeft}" y="${markTop}" width="${markSize}" height="${markSize}" rx="5" fill="none" stroke="${palette.sand}" stroke-width="1" />
    ${textElement(siteName.toUpperCase(), { x: markLeft + 70, y: 108, family: fontFamily.serif, size: 18, weight: 600, fill: palette.ink, letterSpacing: "0.08em" })}
    ${textElement("PERSONAL MEMO", { x: markLeft + 70, y: 131, family: fontFamily.mono, size: 11, weight: 500, fill: palette.fog, letterSpacing: "0.12em" })}
    ${textElement("MEMO · 01 / 备忘", { x: layout.contentRight, y: 111, family: fontFamily.mono, size: 12, weight: 500, fill: palette.fog, letterSpacing: "0.07em", anchor: "end" })}
    <line x1="${layout.contentLeft}" y1="164" x2="${layout.contentRight}" y2="164" stroke="${palette.oat}" stroke-width="1" />
  `;
}

function renderTitle(layout: OgLayout): string {
  const title = layout.lines
    .map((line, i) =>
      textElement(line, {
        x: layout.titleLeft,
        y: layout.blockY + i * layout.contentLineHeight,
        family: fontFamily.serif,
        size: layout.titleSize,
        weight: 600,
        fill: palette.ink,
        letterSpacing: "-0.035em",
      }),
    )
    .join("\n");

  const ruleTop = layout.blockY - layout.titleSize * 0.78;
  const ruleBottom = layout.blockY + (layout.lines.length - 1) * layout.contentLineHeight + 9;
  return `
    <path d="M ${layout.contentLeft} ${ruleTop} V ${ruleBottom}" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round" />
    ${title}
  `;
}

function renderTags(layout: OgLayout, tags: string[]): string {
  if (tags.length === 0) return "";

  const output: string[] = [];
  let x = layout.titleLeft;
  for (const tag of tags.slice(0, 4)) {
    const label = `#${tag}`;
    const width = measureText(label, 13) + 24;
    if (x + width > layout.contentRight) break;
    output.push(`
      <rect x="${x}" y="${layout.tagsY - 20}" width="${width}" height="29" rx="3" fill="${palette.cloud}" stroke="${palette.oat}" stroke-width="1" />
      ${textElement(label, { x: x + 12, y: layout.tagsY, family: fontFamily.mono, size: 13, weight: 500, fill: palette.fog })}
    `);
    x += width + 9;
  }

  return output.join("\n");
}

function renderFooter(layout: OgLayout, domain: string, date: string | null): string {
  const meta = date ?? "A WARM, MINIMAL MEMO SPACE";

  return `
    <rect x="${layout.cardLeft}" y="510" width="${layout.cardRight - layout.cardLeft}" height="${layout.cardBottom - 510}" rx="10" fill="${palette.cloud}" />
    <rect x="${layout.cardLeft}" y="510" width="${layout.cardRight - layout.cardLeft}" height="10" fill="${palette.cloud}" />
    <line x1="${layout.cardLeft}" y1="510" x2="${layout.cardRight}" y2="510" stroke="${palette.oat}" stroke-width="1" />
    ${textElement(domain.toUpperCase(), { x: layout.contentLeft, y: layout.footerY, family: fontFamily.sans, size: 14, weight: 600, fill: palette.ink, letterSpacing: "0.09em" })}
    ${textElement(meta, { x: layout.contentRight, y: layout.footerY, family: fontFamily.mono, size: 12, weight: 400, fill: palette.fog, letterSpacing: "0.05em", anchor: "end" })}
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
