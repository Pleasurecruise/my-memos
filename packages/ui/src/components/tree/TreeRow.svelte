<script lang="ts">
  import { ChevronRight, FileText, Folder, FolderOpen } from "@lucide/svelte";
  import { cn } from "../../lib/utils";

  let {
    node,
    depth,
    expanded,
    active,
    hasChildren,
    baseUrl = "",
    rowSnippet,
    class: extraClass = "",
  } = $props();
</script>

<div
  class={cn(
    "flex items-center gap-0.5 rounded-md select-none",
    "text-foreground transition-colors duration-[var(--duration-fast)]",
    "hover:bg-muted",
    hasChildren && "cursor-pointer",
    active && "bg-accent/12 text-accent",
    extraClass,
  )}
  style="height: var(--tree-row-height, 36px); padding: 0 8px; margin: var(--tree-gap, 2px) 0; font-size: var(--tree-font-size, 14.5px);"
>
  <span class="shrink-0" style="padding-left:{depth * 16}px"></span>

  <span
    class="inline-flex shrink-0 items-center justify-center text-muted-foreground"
    style="width: var(--tree-chevron-size, 16px); height: var(--tree-row-height, 36px);"
  >
    {#if hasChildren}
      <ChevronRight
        size={16}
        class={cn("transition-transform duration-[var(--duration-fast)]", expanded && "rotate-90")}
      />
    {/if}
  </span>

  <span
    class={cn(
      "ml-0.5 mr-1.5 inline-flex shrink-0 items-center justify-center",
      active ? "text-accent" : "text-muted-foreground",
    )}
  >
    {#if node.kind === "folder"}
      {#if expanded}
        <FolderOpen />
      {:else}
        <Folder />
      {/if}
    {:else}
      <FileText />
    {/if}
  </span>

  <span class="min-w-0 flex-1 truncate">
    {#if node.kind === "file" && baseUrl}
      <a
        class="text-inherit no-underline hover:underline hover:underline-offset-[3px]"
        href={baseUrl + "/" + node.path}>{node.name}</a
      >
    {:else}
      {node.name}
    {/if}
  </span>

  {#if node.meta?.fileCount}
    <span
      class="shrink-0 rounded-full bg-muted px-1.5 py-px font-mono text-[0.75em] leading-[1.4] text-muted-foreground"
    >
      {node.meta.fileCount}
    </span>
  {/if}

  {#if rowSnippet}
    <span class="ml-auto inline-flex shrink-0 items-center">
      {@render rowSnippet({ node, depth })}
    </span>
  {/if}
</div>
