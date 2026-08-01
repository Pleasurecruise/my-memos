import { Octokit } from "@octokit/core";
import { z } from "zod";
import { DomainError } from "./errors";
import type { DomainOperation, DomainOperationDefinition } from "./types";

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

export function formatMemo(
  row: { id: string; createdAt: string; tagsJson: string[] },
  body: string,
) {
  return `id: ${row.id}\n[${row.createdAt.slice(0, 10)}] tags: ${row.tagsJson.join(", ") || "none"}\n${body}`;
}

export function requireOk(response: Response, source: string) {
  if (!response.ok) {
    throw new DomainError(
      response.status === 404 ? "not_found" : "upstream_failure",
      `${source} returned ${response.status} ${response.statusText}.`,
    );
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

  const octokit = new Octokit({ request: { signal } });
  let data: unknown;
  if (!type) {
    ({ data } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
      request: { signal },
    }));
  } else if (type === "commit" && ref) {
    ({ data } = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
      owner,
      repo,
      ref,
      request: { signal },
    }));
  } else if (type === "pull" && ref) {
    ({ data } = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: Number(ref),
      request: { signal },
    }));
  } else if (type === "issues" && ref) {
    ({ data } = await octokit.request("GET /repos/{owner}/{repo}/issues/{issue_number}", {
      owner,
      repo,
      issue_number: Number(ref),
      request: { signal },
    }));
  } else if ((type === "blob" || type === "tree") && ref) {
    ({ data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: [ref, ...rest].join("/"),
      request: { signal },
    }));
  } else {
    throw new DomainError("invalid_input", "Unsupported GitHub URL.");
  }

  const json = JSON.stringify(data, null, 2);
  return json.length > 12_000 ? `${json.slice(0, 12_000)}\n[...truncated]` : json;
}
