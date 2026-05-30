<script lang="ts">
  import TreeRow from "./TreeRow.svelte";

  let { node, depth, expanded, active, hasChildren, baseUrl, rowSnippet, onToggle, children } =
    $props();

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (hasChildren) onToggle();
  }
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      if (hasChildren) {
        e.preventDefault();
        onToggle();
      }
    }
  }
</script>

<li
  role="treeitem"
  aria-expanded={node.kind === "folder" ? expanded : undefined}
  aria-selected={active || undefined}
  aria-level={depth + 1}
  tabindex={hasChildren ? 0 : undefined}
  class="list-none"
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <TreeRow {node} {depth} {expanded} {active} {hasChildren} {baseUrl} {rowSnippet} />
  {#if children}{@render children()}{/if}
</li>
