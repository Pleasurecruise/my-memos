<script module lang="ts">
  import type { HTMLTextareaAttributes } from "svelte/elements";

  export interface TextareaProps extends HTMLTextareaAttributes {
    error?: boolean;
    autoresize?: boolean;
  }
</script>

<script lang="ts">
  import { cn } from "../lib/utils";

  const base = cn(
    "flex min-h-20 w-full rounded-md border bg-background px-3 py-2",
    "font-sans text-sm text-foreground placeholder:text-muted-foreground",
    "outline-none transition-colors duration-100 resize-y",
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  );

  let {
    error,
    autoresize = false,
    class: extraClass = "",
    oninput: userOninput,
    ...rest
  }: TextareaProps = $props();

  let el = $state<HTMLTextAreaElement | undefined>(undefined);

  function resize() {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  $effect(() => {
    if (autoresize && el) {
      // Re-run when value prop changes (e.g. cleared after submit)
      void rest.value;
      Promise.resolve().then(resize);
    }
  });
</script>

<textarea
  bind:this={el}
  class={cn(
    base,
    autoresize && "resize-none overflow-hidden",
    error ? "border-error focus-visible:ring-error" : "border-border focus-visible:ring-accent",
    extraClass,
  )}
  oninput={(e) => {
    if (autoresize) resize();
    userOninput?.(e as Event & { currentTarget: HTMLTextAreaElement });
  }}
  {...rest}
></textarea>
