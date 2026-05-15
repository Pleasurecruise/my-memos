<script module lang="ts">
  export const title = "Tokens";
</script>

<script lang="ts">
  const colorSwatches: { name: string; bg: string; fg: string }[] = [
    { name: "background", bg: "bg-background", fg: "text-foreground" },
    { name: "muted", bg: "bg-muted", fg: "text-foreground" },
    { name: "foreground", bg: "bg-foreground", fg: "text-background" },
    { name: "muted-foreground", bg: "bg-muted-foreground", fg: "text-background" },
    { name: "border", bg: "bg-border", fg: "text-foreground" },
    { name: "accent", bg: "bg-accent", fg: "text-accent-foreground" },
    { name: "success", bg: "bg-success", fg: "text-background" },
    { name: "warning", bg: "bg-warning", fg: "text-background" },
    { name: "error", bg: "bg-error", fg: "text-background" },
  ];

  const fontSamples: { label: string; cls: string; text: string }[] = [
    {
      label: "font-sans 600",
      cls: "font-sans text-2xl font-semibold text-foreground",
      text: "Heading — 君の名字",
    },
    {
      label: "font-sans 400",
      cls: "font-sans text-sm text-foreground",
      text: "Body — The quick brown fox",
    },
    {
      label: "font-serif 400",
      cls: "font-serif text-base text-foreground",
      text: "Prose — 物の哀れ",
    },
    {
      label: "font-mono 400",
      cls: "font-mono text-sm text-muted-foreground",
      text: "const x = 0  // mono",
    },
  ];
</script>

<div class="flex flex-col gap-10">
  <section class="flex flex-col gap-3">
    <p class="font-mono text-2.75 uppercase tracking-widest text-muted-foreground">Colors</p>
    <div class="flex flex-wrap gap-3">
      {#each colorSwatches as { name, bg, fg } (name)}
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="{bg} {fg} w-11 h-11 rounded-md border border-border flex items-center justify-center text-2.25 font-mono"
          ></div>
          <span class="font-mono text-2.5 text-muted-foreground">{name}</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="flex flex-col gap-4">
    <p class="font-mono text-2.75 uppercase tracking-widest text-muted-foreground">Typography</p>
    <div class="flex flex-col gap-3">
      {#each fontSamples as { label, cls, text } (label)}
        <div class="flex items-baseline gap-4">
          <span class="font-mono text-2.5 text-muted-foreground w-32 shrink-0">{label}</span>
          <span class={cls}>{text}</span>
        </div>
      {/each}
    </div>
  </section>
</div>
