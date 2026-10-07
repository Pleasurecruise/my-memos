<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "@my-memos/ui";
  import { stripHashtags } from "#lib/utils/tags.ts";
  import { renderMarkdown } from "#lib/utils/markdown.ts";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    content: string;
    stripTags?: boolean;
  }

  let { content, class: extraClass = "", stripTags = false, ...rest }: Props = $props();

  const html = $derived(renderMarkdown(stripTags ? stripHashtags(content) : content));
</script>

<div class={cn("md-content", extraClass)} {...rest}>
  {@html html}
</div>
