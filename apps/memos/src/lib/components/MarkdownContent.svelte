<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { marked } from "marked";
  import { cn } from "@my-memos/ui";
  import { stripHashtags } from "$lib/utils";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    content: string;
    stripTags?: boolean;
  }

  let { content, class: extraClass = "", stripTags = false, ...rest }: Props = $props();

  const html = $derived(marked.parse(stripTags ? stripHashtags(content) : content) as string);
</script>

<div class={cn("md-content", extraClass)} {...rest}>
  {@html html}
</div>
