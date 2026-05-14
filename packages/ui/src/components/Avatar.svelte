<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";

  export type AvatarSize = "sm" | "md" | "lg" | "xl";

  export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: AvatarSize;
  }
</script>

<script lang="ts">
  import { cn } from "../lib/utils";

  const sizes: Record<AvatarSize, string> = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
    xl: "h-14 w-14 text-lg",
  };

  let { src, alt, fallback, size = "md", class: extraClass = "", ...rest }: AvatarProps = $props();
</script>

<div
  class={cn(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
    sizes[size],
    extraClass,
  )}
  {...rest}
>
  {#if src}
    <img {src} alt={alt ?? fallback ?? ""} class="h-full w-full object-cover" />
  {:else}
    <span class="select-none font-sans font-medium text-muted-foreground">
      {fallback ? fallback.slice(0, 2).toUpperCase() : "?"}
    </span>
  {/if}
</div>
