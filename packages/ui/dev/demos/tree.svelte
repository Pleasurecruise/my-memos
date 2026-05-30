<script module lang="ts">
  export const title = "Tree";
</script>

<script lang="ts">
  import { Tree } from "../../src";
  import type { TreeProps } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  // Realistic R2 paths for a markdown blog.
  const blogPaths = [
    "drafts/on-typing.md",
    "drafts/susutake-color.md",
    "reading/heian-dyes.md",
    "reading/in-praise-of-shadows.md",
    "tech/cloudflare-pages.md",
    "tech/cloudflare-workers.md",
    "tech/r2-storage.md",
    "tech/svelte-5-runes.md",
    "travel/kyoto/autumn-leaves.md",
    "travel/kyoto/kiyomizu.md",
    "travel/tokyo/asakusa.md",
    "travel/tokyo/ueno.md",
  ];

  const propDefs = [
    {
      name: "paths",
      type: "string[]",
      default: "[]",
      description: "Flat list of file paths. The component builds the tree internally.",
    },
    {
      name: "tree",
      type: "TreeNode[]",
      default: "undefined",
      description: "Pre-built tree structure. Takes precedence over paths when both are given.",
    },
    {
      name: "activePath",
      type: "string",
      default: '""',
      description: "Currently active file path — highlighted and ancestors auto-expanded.",
    },
    {
      name: "baseUrl",
      type: "string",
      default: '""',
      description: "Base URL prepended to file paths for navigation links.",
    },
    {
      name: "expanded",
      type: "string[]",
      default: "undefined",
      description: "Controlled expansion set. Leave undefined for uncontrolled mode.",
    },
    {
      name: "defaultExpandDepth",
      type: "number",
      default: "1",
      description: "In uncontrolled mode, how many levels to expand by default.",
    },
    {
      name: "density",
      type: '"compact" | "default"',
      default: '"default"',
      description: "Row height preset.",
    },
    {
      name: "stripExtension",
      type: "boolean",
      default: "false",
      description: "Strip file extensions from display names.",
    },
    {
      name: "onToggle",
      type: "(path: string, expanded: boolean) => void",
      default: "undefined",
      description: "Fired whenever a folder is toggled.",
    },
    {
      name: "children",
      type: "Snippet<[{ node, depth }]>",
      default: "undefined",
      description: "Optional per-row decoration snippet.",
    },
  ];

  const usage = `import { Tree } from "@my-memos/ui";

const blogPaths = [
  "tech/svelte-5-runes.md",
  "tech/cloudflare-workers.md",
  "reading/heian-dyes.md",
  "travel/kyoto/kiyomizu.md",
];

<!-- uncontrolled, auto-expands to level 1 -->
<Tree {paths} activePath="tech/svelte-5-runes.md" baseUrl="/memos" />

<!-- controlled by external state -->
<Tree {paths} expanded={openDirs} onToggle={(p, open) => { ... }} />

<!-- with a row decoration -->
<Tree {paths} stripExtension>
  {#snippet children({ node, depth })}
    {#if node.kind === "file"}
      <span class="text-xs muted">12 min</span>
    {/if}
  {/snippet}
</Tree>`;

  // Demo states
  let demoActive = $state(blogPaths[4]); // "tech/cloudflare-pages.md"
  let demoDensity = $state<"compact" | "default">("default");

  // Controlled-mode demo
  let controlledExpanded = $state(["tech", "travel"]);
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Default — blog directory tree</SectionLabel>
    <div
      style="max-width: 340px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree paths={blogPaths} />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Active path: {demoActive}</SectionLabel>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
      {#each blogPaths.filter((p) => !p.includes("/") || p.split("/").length > 1).slice(0, 6) as p}
        <button
          style="
            font-family: var(--font-mono); font-size: 11px;
            padding: 4px 10px; border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            background: {demoActive === p
            ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
            : 'var(--color-background)'};
            color: {demoActive === p ? 'var(--color-accent)' : 'var(--color-muted-foreground)'};
            cursor: pointer;
          "
          onclick={() => (demoActive = p)}
        >
          {p}
        </button>
      {/each}
    </div>
    <div
      style="max-width: 340px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree paths={blogPaths} activePath={demoActive} baseUrl="/memos" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <SectionLabel>Density</SectionLabel>
      <button
        style="
          font-family: var(--font-mono); font-size: 11px;
          padding: 4px 12px; border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-background);
          color: var(--color-foreground);
          cursor: pointer;
        "
        onclick={() => (demoDensity = demoDensity === "default" ? "compact" : "default")}
      >
        {demoDensity}
      </button>
    </div>
    <div
      style="max-width: 340px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree paths={blogPaths} activePath={demoActive} density={demoDensity} />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Controlled expansion</SectionLabel>
    <div
      style="max-width: 340px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree
        paths={blogPaths}
        expanded={controlledExpanded}
        onToggle={(path, open) => {
          controlledExpanded = open
            ? [...controlledExpanded, path]
            : controlledExpanded.filter((p) => p !== path);
        }}
      />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>stripExtension — clean display names</SectionLabel>
    <div
      style="max-width: 340px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree paths={blogPaths} stripExtension />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Row decoration slot</SectionLabel>
    <div
      style="max-width: 420px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 4px 0;"
    >
      <Tree paths={blogPaths} activePath="tech/cloudflare-workers.md">
        {#snippet children({ node, depth })}
          {#if node.kind === "folder" && node.meta?.fileCount !== undefined}
            <span
              style="
                font-family: var(--font-mono); font-size: 11px;
                color: var(--color-muted-foreground);
                opacity: 0.6;
              "
            >
              {node.meta.fileCount} posts
            </span>
          {:else if node.kind === "file"}
            <span
              style="
                font-family: var(--font-mono); font-size: 10px;
                color: var(--color-muted-foreground);
                opacity: 0.5;
              "
            >
              .md
            </span>
          {/if}
        {/snippet}
      </Tree>
    </div>
  </section>
</DemoPage>
