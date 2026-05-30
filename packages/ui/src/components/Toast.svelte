<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "../lib/utils";

  export type ToastVariant = "default" | "success" | "warning" | "error";

  export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
    variant?: ToastVariant;
    title: string;
    description?: string;
  }

  const borders: Record<ToastVariant, string> = {
    default: "border-border",
    success: "border-success/30",
    warning: "border-warning/30",
    error: "border-error/30",
  };

  const dots: Record<ToastVariant, string> = {
    default: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  let {
    variant = "default",
    title,
    description,
    class: extraClass = "",
    ...rest
  }: ToastProps = $props();
</script>

<div
  class={cn(
    "flex w-80 items-start gap-3 rounded-md border bg-background p-4",
    "shadow-[0_1px_4px_0_rgba(0,0,0,.06)]",
    borders[variant],
    extraClass,
  )}
  {...rest}
>
  <span class={cn("mt-[0.3125rem] h-1.5 w-1.5 shrink-0 rounded-full", dots[variant])}></span>
  <div class="flex flex-col gap-0.5">
    <p class="font-sans text-sm font-medium text-foreground">{title}</p>
    {#if description}
      <p class="font-sans text-xs text-muted-foreground">{description}</p>
    {/if}
  </div>
</div>
