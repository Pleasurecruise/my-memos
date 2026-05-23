<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "@my-memos/ui";
  import { stripHashtags } from "$lib/utils";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    content: string;
    stripTags?: boolean;
  }

  let { content, class: extraClass = "", stripTags = false, ...rest }: Props = $props();

  let html = $state("");

  $effect(() => {
    const source = stripTags ? stripHashtags(content) : content;
    const raw = marked.parse(source, { async: false, breaks: true }) as string;
    html = DOMPurify.sanitize(raw);
  });
</script>

<div class={cn("md-content", extraClass)} {...rest}>
  {@html html}
</div>
