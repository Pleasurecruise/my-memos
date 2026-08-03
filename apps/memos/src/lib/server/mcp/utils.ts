import { z } from "zod";
import { DomainError } from "./errors";
import type { DomainOperation, DomainOperationDefinition } from "./types";

export const MAX_EXTERNAL_RESPONSE_BYTES = 1_000_000;

const githubFileSchema = z.object({
  type: z.literal("file"),
  encoding: z.literal("base64"),
  content: z.string(),
});

export function defineOperation<TSchema extends z.ZodType>(
  definition: DomainOperationDefinition<TSchema>,
): DomainOperation {
  return {
    ...definition,
    execute: async (input, signal) => definition.execute(definition.schema.parse(input), signal),
  };
}

export const publicHttpUrl = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    const ipv4 = host.split(".").map(Number);
    const privateIpv4 =
      ipv4.length === 4 &&
      ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) &&
      (ipv4[0] === 0 ||
        ipv4[0] === 10 ||
        ipv4[0] === 127 ||
        (ipv4[0] === 169 && ipv4[1] === 254) ||
        (ipv4[0] === 172 && ipv4[1] >= 16 && ipv4[1] <= 31) ||
        (ipv4[0] === 192 && ipv4[1] === 168));
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      host !== "localhost" &&
      !host.endsWith(".localhost") &&
      !host.endsWith(".local") &&
      !host.endsWith(".internal") &&
      host !== "::1" &&
      !/^f[cd][0-9a-f]{2}:/i.test(host) &&
      !/^fe[89ab][0-9a-f]:/i.test(host) &&
      !privateIpv4
    );
  }, "URL must use HTTP(S) and address a public host without embedded credentials.");

export function formatMemo(memo: { id: string; createdAt: string; tags: string[] }, body: string) {
  return `id: ${memo.id}\n[${memo.createdAt.slice(0, 10)}] tags: ${memo.tags.join(", ") || "none"}\n${body}`;
}

export function requireOk(response: Response, source: string) {
  if (!response.ok) {
    throw new DomainError(
      response.status === 404 ? "not_found" : "upstream_failure",
      `${source} returned ${response.status} ${response.statusText}.`,
    );
  }
}

export async function readLimitedText(
  response: Response,
  source: string,
  maxBytes = MAX_EXTERNAL_RESPONSE_BYTES,
): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel();
    throw new DomainError(
      "upstream_failure",
      `${source} response exceeds the ${maxBytes}-byte limit.`,
    );
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let byteLength = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > maxBytes) {
        await reader.cancel();
        throw new DomainError(
          "upstream_failure",
          `${source} response exceeds the ${maxBytes}-byte limit.`,
        );
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export function cleanMarkdown(markdown: string) {
  const clean = markdown
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
  return clean.length > 12_000
    ? `${clean.slice(0, 12_000)}\n\n[...truncated, total ${clean.length} chars]`
    : clean;
}

export async function githubRead(inputUrl: string, signal: AbortSignal) {
  const url = new URL(inputUrl);
  if (url.hostname !== "github.com") {
    throw new DomainError("invalid_input", "Expected a github.com URL.");
  }
  const [owner, repo, type, ref, ...rest] = url.pathname.replace(/^\/|\/$/g, "").split("/");
  if (!owner || !repo) {
    throw new DomainError("invalid_input", "GitHub URL is missing owner or repository.");
  }

  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  let endpoint: string;
  if (!type) {
    endpoint = repoPath;
  } else if (type === "commit" && ref) {
    endpoint = `${repoPath}/commits/${encodeURIComponent(ref)}`;
  } else if (type === "pull" && ref && /^\d+$/.test(ref)) {
    endpoint = `${repoPath}/pulls/${ref}`;
  } else if (type === "issues" && ref && /^\d+$/.test(ref)) {
    endpoint = `${repoPath}/issues/${ref}`;
  } else if ((type === "blob" || type === "tree") && ref) {
    const contentPath = rest.map(encodeURIComponent).join("/");
    endpoint = `${repoPath}/contents${contentPath ? `/${contentPath}` : ""}?ref=${encodeURIComponent(ref)}`;
  } else {
    throw new DomainError("invalid_input", "Unsupported GitHub URL.");
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "my-memos/1.0",
    },
    signal,
  });
  requireOk(response, "GitHub");
  const data: unknown = JSON.parse(await readLimitedText(response, "GitHub"));

  const githubFile = githubFileSchema.safeParse(data);
  if (githubFile.success) {
    const bytes = Uint8Array.from(atob(githubFile.data.content.replace(/\s/g, "")), (char) =>
      char.charCodeAt(0),
    );
    const decoded = new TextDecoder().decode(bytes);
    return cleanMarkdown(decoded);
  }

  const json = JSON.stringify(data, null, 2);
  return json.length > 12_000 ? `${json.slice(0, 12_000)}\n[...truncated]` : json;
}
