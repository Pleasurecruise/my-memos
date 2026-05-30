<script lang="ts">
  import type { Snippet } from "svelte";
  import { buildTree } from "../../lib/buildTree";
  import type { TreeNode } from "../../lib/buildTree";
  import TreeItem from "./TreeItem.svelte";

  export interface TreeProps {
    paths?: string[];
    tree?: TreeNode[];
    activePath?: string;
    baseUrl?: string;
    expanded?: string[];
    defaultExpandDepth?: number;
    stripExtension?: boolean;
    density?: "compact" | "default";
    onToggle?: (path: string, expanded: boolean) => void;
    children?: Snippet<[{ node: TreeNode; depth: number }]>;
  }

  let {
    paths = [],
    tree: prebuiltTree = undefined,
    activePath = "",
    baseUrl = "",
    expanded: controlledExpanded = undefined,
    defaultExpandDepth = 1,
    stripExtension = false,
    density = "default",
    onToggle = undefined,
    children: rowSnippet,
  }: TreeProps = $props();

  const nodes = $derived(prebuiltTree ?? buildTree(paths, { stripExtension }));
  const isControlled = $derived(controlledExpanded !== undefined);
  let expandMap = $state<Record<string, boolean>>({});

  $effect(() => {
    if (isControlled) {
      const next: Record<string, boolean> = {};
      for (const p of controlledExpanded!) next[p] = true;
      expandMap = next;
      return;
    }
    const next: Record<string, boolean> = {};
    walkDepth(nodes, 0, defaultExpandDepth, next);
    if (activePath) for (const a of getAncestors(activePath)) next[a] = true;
    expandMap = next;
  });

  $effect(() => {
    if (!activePath || isControlled) return;
    const ancestors = getAncestors(activePath);
    let changed = false;
    for (const a of ancestors) {
      if (!expandMap[a]) {
        expandMap[a] = true;
        changed = true;
      }
    }
    if (changed) expandMap = { ...expandMap };
  });

  function isExpanded(path: string) {
    return isControlled ? controlledExpanded!.includes(path) : !!expandMap[path];
  }
  function toggle(path: string) {
    if (isControlled) {
      onToggle?.(path, !isExpanded(path));
    } else {
      expandMap = { ...expandMap, [path]: !isExpanded(path) };
    }
  }

  const densityVars = $derived(
    density === "compact"
      ? "--tree-row-height:28px;--tree-indent:12px;--tree-font-size:13px;--tree-chevron-size:14px;--tree-icon-size:15px;--tree-gap:0px;"
      : "--tree-row-height:36px;--tree-indent:16px;--tree-font-size:14.5px;--tree-chevron-size:16px;--tree-icon-size:16px;--tree-gap:2px;",
  );

  function walkDepth(list: TreeNode[], cur: number, max: number, map: Record<string, boolean>) {
    if (cur >= max) return;
    for (const n of list) {
      if (n.kind === "folder") {
        map[n.path] = true;
        if (n.children) walkDepth(n.children, cur + 1, max, map);
      }
    }
  }
  function getAncestors(path: string): string[] {
    const segs = path.split("/");
    if (segs.length <= 1) return [];
    return segs.slice(0, -1).map((_, i) => segs.slice(0, i + 1).join("/"));
  }
</script>

{#snippet item(node: TreeNode, depth: number)}
  <TreeItem
    {node}
    {depth}
    {baseUrl}
    {rowSnippet}
    expanded={node.kind === "folder" && isExpanded(node.path)}
    active={node.kind === "file" && !!activePath && node.path === activePath}
    hasChildren={node.kind === "folder" && !!node.children?.length}
    onToggle={() => toggle(node.path)}
  >
    {#snippet children()}
      {#if node.kind === "folder" && isExpanded(node.path) && node.children}
        <ul role="group" class="m-0 list-none p-0">
          {#each node.children as child (child.path)}
            {@render item(child, depth + 1)}
          {/each}
        </ul>
      {/if}
    {/snippet}
  </TreeItem>
{/snippet}

<ul class="m-0 list-none p-0" role="tree" style={densityVars}>
  {#each nodes as node (node.path)}
    {@render item(node, 0)}
  {/each}
</ul>
