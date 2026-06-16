import type { KVNamespace } from "@cloudflare/workers-types";

const KV_PREFIX = "og-font:";
const FONT_TTL = 60 * 60 * 24 * 30;

// Old UA so Google Fonts returns ttf, the only format resvg-wasm can parse.
const TTF_USER_AGENT =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-us) AppleWebKit/533.18.1 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5";

export const OG_FONT_FAMILIES = {
  sans: "Noto Sans SC",
  serif: "Noto Serif SC",
} as const;

const FONT_FAMILIES = [OG_FONT_FAMILIES.sans, OG_FONT_FAMILIES.serif] as const;

// Color emoji fonts are ~20MB even subset, so we fall back to monochrome Noto Emoji.
const EMOJI_FAMILY = "Noto Emoji";

const BASELINE_CHARS =
  " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;!?/#&@()[]-—…'\"";

export async function loadOgFonts(text: string, kv: KVNamespace): Promise<Uint8Array[]> {
  const chars = Array.from(new Set(BASELINE_CHARS + text))
    .sort()
    .join("");
  const cacheKey = await hashChars(chars);
  const requests = FONT_FAMILIES.map((family) => loadFont(family, chars, cacheKey, kv));

  const emoji = Array.from(new Set(text)).filter(isEmojiChar).sort().join("");
  if (emoji) {
    requests.push(loadFont(EMOJI_FAMILY, emoji, await hashChars(emoji), kv));
  }

  const fonts = await Promise.all(requests);
  return fonts.filter((font): font is Uint8Array => font != null);
}

function isEmojiChar(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return (
    code >= 0x1f000 ||
    (code >= 0x2600 && code <= 0x27bf) ||
    (code >= 0x2300 && code <= 0x23ff) ||
    (code >= 0x2b00 && code <= 0x2bff)
  );
}

async function loadFont(
  family: string,
  chars: string,
  cacheKey: string,
  kv: KVNamespace,
): Promise<Uint8Array | null> {
  const key = `${KV_PREFIX}${family}:${cacheKey}`;
  const cached = await kv.get(key, "arrayBuffer");
  if (cached) {
    return new Uint8Array(cached);
  }

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&text=${encodeURIComponent(chars)}`;
  const css = await fetch(cssUrl, { headers: { "User-Agent": TTF_USER_AGENT } }).then((res) =>
    res.text(),
  );
  const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) {
    return null;
  }

  const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
  await kv.put(key, fontBytes, { expirationTtl: FONT_TTL });
  return new Uint8Array(fontBytes);
}

async function hashChars(chars: string): Promise<string> {
  const data = new TextEncoder().encode(chars);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
