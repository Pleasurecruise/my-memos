<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { applyTheme } from "@my-memos/ui";
  import { Menu } from "@lucide/svelte";
  import Sidebar from "$lib/components/layout/Sidebar.svelte";
  import type { TagCount } from "$lib/types";

  interface Props {
    tags?: TagCount[];
    activeTags?: string[];
    viewAsPublic?: boolean;
    selectedDate?: Date;
    onDateChange?: (date: Date | undefined) => void;
    children: Snippet;
  }

  let {
    tags = [],
    activeTags = [],
    viewAsPublic = false,
    selectedDate,
    onDateChange = () => {},
    children,
  }: Props = $props();

  const STORAGE_KEY = "my-memos:theme";
  let isDark = $state(false);
  let sidebarOpen = $state(false);

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(isDark);
  });

  $effect(() => {
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  });
</script>

<div class="flex h-screen bg-background text-foreground font-sans overflow-hidden">
  <button
    type="button"
    class={[
      "fixed inset-0 z-30 bg-black/40 md:hidden",
      "transition-opacity duration-200 cursor-default",
      sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
    ].join(" ")}
    aria-label="Close sidebar"
    tabindex={sidebarOpen ? 0 : -1}
    onclick={() => (sidebarOpen = false)}
    onkeydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
  ></button>

  <Sidebar
    {tags}
    {activeTags}
    {viewAsPublic}
    {isDark}
    open={sidebarOpen}
    onToggleTheme={(btn) => {
      const next = !isDark;
      applyTheme(next, btn);
      isDark = next;
    }}
    onClose={() => (sidebarOpen = false)}
    {selectedDate}
    {onDateChange}
  />

  <main class="flex-1 overflow-y-auto min-w-0">
    <div
      class="sticky top-0 z-20 flex items-center gap-3 px-4 h-12 bg-background/95 backdrop-blur-sm border-b border-border md:hidden"
    >
      <button
        onclick={() => (sidebarOpen = !sidebarOpen)}
        class="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <span class="font-serif font-semibold text-accent tracking-tight">my memos</span>
    </div>

    {@render children()}
  </main>
</div>
