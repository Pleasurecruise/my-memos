<script lang="ts">
  import { Tree } from "@my-memos/ui";
  import Masthead from "./Masthead.svelte";

  interface Props {
    paths: string[];
    fileMeta: Record<string, { size: number; updated: string }>;
  }

  let { paths, fileMeta }: Props = $props();

  const BLOG_PREFIX = "blog/";
  const relativePaths = $derived(
    paths.map((p) => (p.startsWith(BLOG_PREFIX) ? p.slice(BLOG_PREFIX.length) : p)),
  );

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-24 pt-7">
    <Masthead />

    <div class="max-w-180 mx-auto mb-8">
      <div class="relative inline-block">
        <h1 class="font-serif font-semibold text-7 text-foreground leading-none">note</h1>
        <span class="absolute left-0 -bottom-1.5 h-0.5 w-8 rounded-sm bg-accent"></span>
      </div>
      <p class="text-sm text-muted-foreground mt-4">Blog files stored in R2 bucket.</p>
    </div>

    <div class="max-w-180 mx-auto"></div>
  </div>
</div>
