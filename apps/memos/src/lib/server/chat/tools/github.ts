import { tool } from "ai";
import { z } from "zod";
import { Octokit } from "@octokit/core";

const VALID_GITHUB_TYPES = new Set(["commit", "pull", "issues", "blob", "tree"]);

interface ParsedGitHubUrl {
  org: string;
  repo: string;
  type?: string;
  ref?: string;
  num?: string;
  extraPath?: string;
}

/**
 * Parse a GitHub URL into components.
 * Uses URL parsing to handle query strings, fragments, and trailing slashes.
 *
 * Supports:
 *   https://github.com/{org}/{repo}
 *   https://github.com/{org}/{repo}/commit/{sha}
 *   https://github.com/{org}/{repo}/pull/{num}
 *   https://github.com/{org}/{repo}/issues/{num}
 *   https://github.com/{org}/{repo}/blob/{ref}/{path...}
 *   https://github.com/{org}/{repo}/tree/{ref}/{path...}
 */
function parseGitHubUrl(rawUrl: string): ParsedGitHubUrl | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com") return null;

  const segments = url.pathname.replace(/^\/|\/$/g, "").split("/");

  if (segments.length < 2) return null;

  const [org, repo, type, ref, ...extraPathSegments] = segments;
  const extraPath = extraPathSegments.length > 0 ? extraPathSegments.join("/") : undefined;
  const num = type === "pull" || type === "issues" ? ref : undefined;

  if (type && !VALID_GITHUB_TYPES.has(type)) return null;

  return { org, repo, type, ref, num, extraPath };
}

function stringAt(obj: unknown, ...path: string[]): string | undefined {
  let cursor: unknown = obj;
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function numberAt(obj: unknown, ...path: string[]): number | undefined {
  let cursor: unknown = obj;
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "number" ? cursor : undefined;
}

function arrayAt(obj: unknown, ...path: string[]): unknown[] | undefined {
  let cursor: unknown = obj;
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return Array.isArray(cursor) ? cursor : undefined;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  css: "css",
  html: "html",
  svg: "xml",
  rs: "rust",
  go: "go",
  py: "python",
  rb: "ruby",
};

function formatCommitResponse(apiData: unknown): string {
  const sha = stringAt(apiData, "sha")?.slice(0, 7) ?? "?";
  const message = stringAt(apiData, "commit", "message") ?? "";
  const author = stringAt(apiData, "commit", "author", "name") ?? "?";
  const date = stringAt(apiData, "commit", "author", "date") ?? "?";

  const lines = [`Commit: ${sha}`, `Author: ${author}`, `Date: ${date}`, "", message];

  const files = arrayAt(apiData, "files");
  if (files && files.length > 0) {
    lines.push("", "## Changed files");
    const visibleFiles = files.slice(0, 20);
    for (const file of visibleFiles) {
      const status = stringAt(file, "status") ?? "modified";
      const filename = stringAt(file, "filename") ?? "?";
      const additions = numberAt(file, "additions") ?? 0;
      const deletions = numberAt(file, "deletions") ?? 0;
      lines.push(`  ${status}: ${filename} (+${additions} -${deletions})`);
      const patch = stringAt(file, "patch");
      if (patch && patch.length < 2000) {
        lines.push(`\`\`\`diff\n${patch}\n\`\`\``);
      }
    }
    if (files.length > 20) {
      lines.push(`  ... and ${files.length - 20} more files`);
    }
  }

  return lines.join("\n");
}

function formatRepoResponse(apiData: unknown, org: string, repo: string, inputUrl: string): string {
  const fullName = stringAt(apiData, "full_name") ?? `${org}/${repo}`;
  const description = stringAt(apiData, "description");
  const stars = numberAt(apiData, "stargazers_count");
  const forks = numberAt(apiData, "forks_count");
  const language = stringAt(apiData, "language");
  const topics = arrayAt(apiData, "topics");
  const htmlUrl = stringAt(apiData, "html_url") ?? inputUrl;

  const license =
    apiData != null && typeof apiData === "object"
      ? (apiData as Record<string, unknown>)["license"]
      : undefined;
  const licenseName = typeof license === "string" ? license : stringAt(license, "spdx_id");

  return [
    `## ${fullName}`,
    description ? `\n${description}` : "",
    `\n⭐ ${stars ?? "?"}  🍴 ${forks ?? "?"}  🔤 ${language ?? "?"}`,
    topics && topics.length > 0 ? `\nTopics: ${topics.join(", ")}` : "",
    licenseName ? `\nLicense: ${licenseName}` : "",
    `\n\n${htmlUrl}`,
  ].join("");
}

function formatPullResponse(apiData: unknown, pullNumber: string, inputUrl: string): string {
  const title = stringAt(apiData, "title") ?? "";
  const state = stringAt(apiData, "state") ?? "?";
  const user = stringAt(apiData, "user", "login") ?? "?";
  const body = stringAt(apiData, "body") ?? "";
  const htmlUrl = stringAt(apiData, "html_url") ?? inputUrl;

  return [
    `## PR #${pullNumber}: ${title}`,
    `State: ${state}  ·  by ${user}`,
    body ? `\n\n${body}` : "",
    `\n\n${htmlUrl}`,
  ].join("");
}

function formatIssueResponse(apiData: unknown, issueNumber: string, inputUrl: string): string {
  const title = stringAt(apiData, "title") ?? "";
  const state = stringAt(apiData, "state") ?? "?";
  const user = stringAt(apiData, "user", "login") ?? "?";
  const body = stringAt(apiData, "body") ?? "";
  const labels = arrayAt(apiData, "labels");
  const htmlUrl = stringAt(apiData, "html_url") ?? inputUrl;

  const labelNames = labels
    ? labels
        .map((label) => stringAt(label, "name"))
        .filter((name): name is string => name != null)
        .join(", ")
    : "";

  return [
    `## Issue #${issueNumber}: ${title}`,
    `State: ${state}  ·  by ${user}`,
    labelNames ? `\nLabels: ${labelNames}` : "",
    body ? `\n\n${body}` : "",
    `\n\n${htmlUrl}`,
  ].join("");
}

function formatDirectoryResponse(entries: unknown[], path: string, inputUrl: string): string {
  const listing = entries
    .map((entry) => {
      const entryType = stringAt(entry, "type") ?? "?";
      const name = stringAt(entry, "name") ?? "?";
      const size = numberAt(entry, "size");
      const icon = entryType === "dir" ? "📁" : "📄";
      return `  ${icon} ${name}${size != null ? ` (${size} B)` : ""}`;
    })
    .join("\n");

  return [`## Directory: ${path}`, `\n${listing}`, `\n\n${inputUrl}`].join("");
}

function formatFileResponse(apiData: unknown, path: string, inputUrl: string): string {
  const size = numberAt(apiData, "size");
  const encoding = stringAt(apiData, "encoding");

  if (encoding === "base64") {
    const content = stringAt(apiData, "content");
    if (!content) {
      return `File: ${path} — base64 content missing, ${size ?? "?"} bytes\n${inputUrl}`;
    }

    const decoded = atob(content);
    const ext = path.split(".").pop() ?? "";
    const lang = EXTENSION_LANGUAGE_MAP[ext] ?? "";

    let body: string;
    if (lang) {
      body = `\n\`\`\`${lang}\n${decoded.slice(0, 8000)}\n\`\`\``;
    } else {
      body = `\n${decoded.slice(0, 8000)}`;
    }

    return [
      `## File: ${path} (${size ?? "?"} bytes)`,
      body,
      decoded.length > 8000 ? `\n\n[...truncated, ${decoded.length} bytes total]` : "",
      `\n\n${inputUrl}`,
    ].join("");
  }

  return `File: ${path} — ${encoding ?? "unknown"} encoding, ${size ?? "?"} bytes\n${inputUrl}`;
}

export function createGitHubTool() {
  const octokit = new Octokit();

  return {
    github_read: tool({
      description:
        "Read content from GitHub using the official API (same as `gh api`). " +
        "Provide a full GitHub URL. Supports: /commit/{sha}, /pull/{num}, /issues/{num}, " +
        "/blob/{ref}/{path}, /tree/{ref}/{path}, or a repo root. " +
        "For raw single files, consider fetch_raw on raw.githubusercontent.com instead.",
      inputSchema: z.object({
        url: z.string().url().describe("Full GitHub URL to read"),
      }),
      execute: async ({ url: inputUrl }) => {
        const parsed = parseGitHubUrl(inputUrl);
        if (!parsed) {
          return `Invalid GitHub URL: ${inputUrl}. Expected pattern: https://github.com/{org}/{repo}[/{type}/{ref}[/{path}]]`;
        }

        const { org, repo, type, ref, num, extraPath } = parsed;

        try {
          if (!type) {
            const { data } = await octokit.request("GET /repos/{owner}/{repo}", {
              owner: org,
              repo,
            });
            return formatRepoResponse(data, org, repo, inputUrl);
          }

          if (type === "commit") {
            const { data } = await octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
              owner: org,
              repo,
              ref: ref!,
            });
            return formatCommitResponse(data);
          }

          if (type === "pull") {
            if (!num) return `Invalid GitHub URL: missing pull request number`;
            const { data } = await octokit.request(
              "GET /repos/{owner}/{repo}/pulls/{pull_number}",
              { owner: org, repo, pull_number: Number(num) },
            );
            return formatPullResponse(data, num, inputUrl);
          }

          if (type === "issues") {
            if (!num) return `Invalid GitHub URL: missing issue number`;
            const { data } = await octokit.request(
              "GET /repos/{owner}/{repo}/issues/{issue_number}",
              { owner: org, repo, issue_number: Number(num) },
            );
            return formatIssueResponse(data, num, inputUrl);
          }

          if (type === "blob" || type === "tree") {
            const path = extraPath ? `${ref}/${extraPath}` : ref!;
            const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
              owner: org,
              repo,
              path,
            });

            if (Array.isArray(data)) {
              return formatDirectoryResponse(data, path, inputUrl);
            }

            return formatFileResponse(data, path, inputUrl);
          }

          return `Unsupported GitHub URL type: ${type}`;
        } catch (err) {
          if (err instanceof Error && "status" in err) {
            const statusCode = (err as { status: number }).status;
            return `GitHub API error (${statusCode}): ${err.message}`;
          }
          return `GitHub API error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),
  };
}
