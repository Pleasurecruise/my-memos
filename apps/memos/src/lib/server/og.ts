export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[#*_~[\]()> "<]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const W = 1200;
const H = 630;

const light = {
  paper: "#faf7eb",
  cloud: "#f5f2ec",
  oat: "#e8e0d0",
  fog: "#726e69",
  ink: "#1a1a1a",
} as const;

const brand = "#963c5a";

const font = {
  sans: '"Geist", "Inter", system-ui, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif',
  serif: '"Lora", "Noto Serif SC", "Source Han Serif SC", Georgia, serif',
  mono: '"Geist Mono", "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace',
} as const;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let rest = text;
  while (rest.length > 0 && lines.length < maxLines) {
    if (rest.length <= maxChars) {
      lines.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(" ", maxChars);
    if (cut <= 0) cut = maxChars;
    lines.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  return lines;
}

function txt(
  text: string,
  o: {
    x: number;
    y: number;
    ff: string;
    fs: number;
    fw: number;
    fill: string;
    opacity?: number;
    ls?: string;
    tt?: string;
    anchor?: "start" | "middle" | "end";
  },
): string {
  const a = [
    `x="${o.x}"`,
    `y="${o.y}"`,
    `font-family="${o.ff.replace(/"/g, "&quot;")}"`,
    `font-size="${o.fs}"`,
    `font-weight="${o.fw}"`,
    `fill="${o.fill}"`,
    o.opacity != null ? `opacity="${o.opacity}"` : "",
    o.ls ? `letter-spacing="${o.ls}"` : "",
    o.tt ? `text-transform="${o.tt}"` : "",
    o.anchor ? `text-anchor="${o.anchor}"` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<text ${a}>${esc(text)}</text>`;
}

function bg(): string {
  return `
    <rect width="${W}" height="${H}" fill="${light.paper}" />
    <defs>
      <radialGradient id="glow" cx="85%" cy="15%" r="55%">
        <stop offset="0%" stop-color="${brand}" stop-opacity="0.06" />
        <stop offset="100%" stop-color="${light.paper}" stop-opacity="0" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${light.oat}" stroke-width="0.5" stroke-opacity="0.35" />
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#glow)" />
    <rect width="${W}" height="${H}" fill="url(#grid)" />
    <circle cx="1120" cy="560" r="3" fill="${brand}" opacity="0.15" />
    <circle cx="1136" cy="548" r="2" fill="${brand}" opacity="0.10" />
    <circle cx="1148" cy="564" r="2.5" fill="${brand}" opacity="0.12" />
    <rect x="0" y="0" width="180" height="3" fill="${brand}" />
  `;
}

export interface OgImageOptions {
  title: string;
  tags?: string[];
  domain?: string;
  date?: string | null;
  siteName?: string;
}

export function renderOgImage(options: OgImageOptions): string {
  const {
    title,
    tags: t = [],
    domain = "my-memos.pages.dev",
    date = null,
    siteName = "My Memos",
  } = options;

  const contentLines = wrap(title, 38, 6);
  const hasTags = t.length > 0;

  const CARD_L = 120;
  const CARD_R = 1080;
  const CARD_T = 70;
  const CARD_B = 560;
  const ID_Y = 120;
  const FOOT_Y = 542;
  const FOOT_SEP_Y = 526;

  const CLH = 46;
  const CHF = 48;
  const CH = CLH * (contentLines.length - 1) + CHF;
  const TAG_H = hasTags ? 44 : 0;
  const blockH = CH + TAG_H;

  const availTop = ID_Y + 44;
  const availBtm = FOOT_SEP_Y - 16;
  const availH = availBtm - availTop;
  const blockY0 = availTop + Math.max(0, (availH - blockH) / 2);

  const barTop = ID_Y - 28;
  const barH = FOOT_SEP_Y - barTop;

  const cardH = CARD_B - CARD_T;

  const parts: string[] = [];

  parts.push(
    `<rect x="${CARD_L}" y="${CARD_T}" width="${CARD_R - CARD_L}" height="${cardH}" rx="10" fill="${light.cloud}" stroke="${light.oat}" stroke-width="1" />`,
  );
  parts.push(`
    <defs>
      <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${brand}" />
        <stop offset="100%" stop-color="${brand}" stop-opacity="0.12" />
      </linearGradient>
    </defs>
    <rect x="${CARD_L + 16}" y="${barTop}" width="3" height="${barH}" rx="1.5" fill="url(#bar)" />
  `);

  parts.push(`
    <image href="https://${domain}/favicon.png" x="${CARD_L + 16 + 12}" y="${ID_Y - 22}" width="28" height="28" clip-path="circle(14px at 14px 14px)" />
    ${txt(siteName, { x: CARD_L + 16 + 46, y: ID_Y, ff: font.sans, fs: 22, fw: 600, fill: light.ink })}
  `);

  contentLines.forEach((line, i) => {
    const y = blockY0 + (i === 0 ? 0 : CHF + (i - 1) * CLH);
    parts.push(
      txt(line, {
        x: CARD_L + 30,
        y,
        ff: i === 0 ? font.serif : font.sans,
        fs: i === 0 ? 36 : 28,
        fw: i === 0 ? 600 : 400,
        fill: i === 0 ? light.ink : light.fog,
      }),
    );
  });

  if (hasTags) {
    const tagY = blockY0 + CH + 24;
    let tx = CARD_L + 30;
    for (const tag of t.slice(0, 5)) {
      const label = `# ${tag}`;
      const tw = label.length * 9 + 28;
      parts.push(`
        <rect x="${tx}" y="${tagY - 18}" width="${tw}" height="28" rx="14" fill="${brand}" fill-opacity="0.10" stroke="${brand}" stroke-opacity="0.20" stroke-width="1" />
        ${txt(label, { x: tx + 14, y: tagY, ff: font.mono, fs: 13, fw: 500, fill: brand })}
      `);
      tx += tw + 8;
    }
  }

  parts.push(
    `<line x1="${CARD_L + 20}" y1="${FOOT_SEP_Y}" x2="${CARD_R}" y2="${FOOT_SEP_Y}" stroke="${light.oat}" stroke-width="1" />`,
  );
  parts.push(
    txt(domain, {
      x: CARD_L + 20,
      y: FOOT_Y,
      ff: font.mono,
      fs: 13,
      fw: 400,
      fill: light.fog,
      opacity: 0.6,
      ls: "0.05em",
      tt: "uppercase",
    }),
  );
  if (date) {
    parts.push(
      txt(date, {
        x: CARD_R,
        y: FOOT_Y,
        ff: font.mono,
        fs: 13,
        fw: 400,
        fill: light.fog,
        opacity: 0.5,
        anchor: "end",
      }),
    );
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    bg(),
    ...parts,
    `</svg>`,
  ].join("\n");
}
