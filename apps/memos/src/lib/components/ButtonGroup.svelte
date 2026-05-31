<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    class?: string;
  }

  let { children, class: extraClass = "" }: Props = $props();
</script>

<div class="btn-group {extraClass}" role="group">
  {@render children()}
</div>

<style>
  .btn-group {
    display: inline-flex;
    border-radius: 9999px;
    box-shadow: var(--shadow-sm);
  }

  .btn-group :global(> :not(:first-child)) {
    margin-left: -1px;
  }

  .btn-group :global(> :first-child) {
    border-top-left-radius: 9999px;
    border-bottom-left-radius: 9999px;
  }

  .btn-group :global(> :last-child) {
    border-top-right-radius: 9999px;
    border-bottom-right-radius: 9999px;
  }

  .btn-group :global(> :not(:first-child):not(:last-child)) {
    border-radius: 0;
  }
</style>
