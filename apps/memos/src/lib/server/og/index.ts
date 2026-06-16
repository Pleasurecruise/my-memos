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
  logo?: string | null;
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
    logo = null,
  } = options;

  const layout = getLayout(wrapText(title, 1000, 44, 44, 6), tags.length > 0);
  const parts = [
    renderHeader(layout, siteName, logo),
    renderHero(layout),
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

function wrapText(
  text: string,
  maxWidth: number,
  firstSize: number,
  restSize: number,
  maxLines: number,
): string[] {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());

  const fill = (budget: number): string[] => {
    const lines: string[] = [];
    let line: string[] = [];
    let width = 0;
    const charWidth = (ch: string) => {
      const size = lines.length === 0 ? firstSize : restSize;
      return isWideChar(ch) ? size : size * 0.6;
    };

    for (const ch of chars) {
      if (width + charWidth(ch) > budget && line.length > 0) {
        const lastSpace = line.lastIndexOf(" ");
        const carried = lastSpace > 0 ? line.slice(lastSpace + 1) : [];
        lines.push(line.slice(0, lastSpace > 0 ? lastSpace : line.length).join(""));
        line = carried;
        width = line.reduce((sum, c) => sum + charWidth(c), 0);
        if (lines.length >= maxLines) {
          line = [];
          break;
        }
      }
      line.push(ch);
      width += charWidth(ch);
    }

    if (line.length > 0 && lines.length < maxLines) lines.push(line.join(""));
    return lines.length > 0 ? lines : [""];
  };

  const greedy = fill(maxWidth);
  if (greedy.length < 2) return greedy;

  let low = 0;
  let high = maxWidth;
  let best = greedy;
  for (let i = 0; i < 16; i++) {
    const mid = (low + high) / 2;
    const candidate = fill(mid);
    if (candidate.length <= greedy.length) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }
  return best;
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
    <rect width="${OG_WIDTH}" height="6" fill="${brand}" />
  `;
}

function getLayout(lines: string[], hasTags: boolean) {
  const marginX = 100;
  const rightX = OG_WIDTH - marginX;

  const logoR = 20;
  const logoCenterX = marginX + logoR;
  const logoCenterY = 100;
  const headerY = logoCenterY + 9;

  const heroSize = 44;
  const heroLineHeight = 60;

  const footerLineY = 556;
  const footerTextY = 590;

  const heroSpan = heroLineHeight * (lines.length - 1) + heroSize;
  const tagBlock = hasTags ? 46 : 0;
  const blockHeight = heroSpan + tagBlock;

  const availableTop = 168;
  const availableBottom = footerLineY - 36;
  const firstBaseline =
    availableTop + Math.max(0, (availableBottom - availableTop - blockHeight) / 2) + heroSize;
  const heroBottomBaseline = firstBaseline + heroLineHeight * (lines.length - 1);

  return {
    lines,
    marginX,
    rightX,
    logoR,
    logoCenterX,
    logoCenterY,
    headerY,
    heroSize,
    heroLineHeight,
    firstBaseline,
    tagY: heroBottomBaseline + 46,
    footerLineY,
    footerTextY,
  };
}

function renderHeader(layout: OgLayout, siteName: string, logo: string | null): string {
  const { logoCenterX: cx, logoCenterY: cy, logoR: r } = layout;
  const mark = logo
    ? `
      <defs><clipPath id="logoClip"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath></defs>
      <image x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" href="${logo}" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice" />
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.oat}" />`
    : `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${brand}" fill-opacity="0.12" stroke="${brand}" stroke-opacity="0.28" />
      ${textElement("M", { x: cx, y: cy + 6, family: fontFamily.serif, size: 18, weight: 600, fill: brand, anchor: "middle" })}`;

  return `
    ${mark}
    ${textElement(siteName, { x: cx + r + 16, y: layout.headerY, family: fontFamily.sans, size: 26, weight: 600, fill: palette.ink })}
  `;
}

function renderHero(layout: OgLayout): string {
  return layout.lines
    .map((line, i) =>
      textElement(line, {
        x: layout.marginX,
        y: layout.firstBaseline + i * layout.heroLineHeight,
        family: fontFamily.serif,
        size: layout.heroSize,
        weight: 500,
        fill: palette.ink,
      }),
    )
    .join("\n");
}

function renderTags(layout: OgLayout, tags: string[]): string {
  if (tags.length === 0) return "";

  let x = layout.marginX;
  const out: string[] = [];
  for (const tag of tags.slice(0, 5)) {
    const label = `#${tag}`;
    const width = measureText(label, 20);
    if (out.length > 0 && x + width > layout.rightX) break;
    out.push(
      textElement(label, {
        x,
        y: layout.tagY,
        family: fontFamily.sans,
        size: 20,
        weight: 500,
        fill: brand,
      }),
    );
    x += width + 24;
  }
  return out.join("\n");
}

function renderFooter(layout: OgLayout, domain: string, date: string | null): string {
  const parts = [
    `<line x1="${layout.marginX}" y1="${layout.footerLineY}" x2="${layout.rightX}" y2="${layout.footerLineY}" stroke="${palette.oat}" stroke-width="1" />`,
    textElement(domain, {
      x: layout.marginX,
      y: layout.footerTextY,
      family: fontFamily.sans,
      size: 19,
      weight: 400,
      fill: palette.fog,
      letterSpacing: "0.04em",
      transform: "uppercase",
    }),
  ];

  if (date) {
    parts.push(
      textElement(date, {
        x: layout.rightX,
        y: layout.footerTextY,
        family: fontFamily.sans,
        size: 19,
        weight: 400,
        fill: palette.fog,
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
