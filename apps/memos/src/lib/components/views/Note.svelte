<script lang="ts">
  import { onMount } from "svelte";
  import { Plus } from "@lucide/svelte";
  import Masthead from "$lib/components/layout/Masthead.svelte";

  interface Props {
    paths: string[];
    fileMeta: Record<string, { size: number; createdAt: string; updatedAt: string; title: string }>;
  }

  let { paths, fileMeta }: Props = $props();

  interface NoteListItem {
    id: string;
    title: string;
    date: Date;
    href: string;
    type: string;
  }

  const entries = $derived(
    paths
      .map((path) => {
        const meta = fileMeta[path];
        const date = meta ? new Date(meta.createdAt) : new Date(0);
        const segments = path.split("/").filter(Boolean);
        const fileName = segments.at(-1) ?? path;
        const folder = segments.slice(0, -1).join("/");

        return {
          id: path,
          title: meta?.title,
          date,
          href: `/note/${path.split("/").map(encodeURIComponent).join("/")}`,
          type: typeFromFolder(folder),
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()),
  );

  const groupedEntries = $derived.by(() => {
    const yearGroups = new Map<number, Map<number, NoteListItem[]>>();

    for (const entry of entries) {
      const year = entry.date.getFullYear();
      const month = entry.date.getMonth();
      const monthGroups = yearGroups.get(year) ?? new Map<number, NoteListItem[]>();
      monthGroups.set(month, [...(monthGroups.get(month) ?? []), entry]);
      yearGroups.set(year, monthGroups);
    }

    return [...yearGroups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthGroups]) => ({
        year,
        count: [...monthGroups.values()].reduce(
          (total, monthEntries) => total + monthEntries.length,
          0,
        ),
        months: [...monthGroups.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, monthEntries]) => ({
            month,
            entries: monthEntries.sort((a, b) => b.date.getTime() - a.date.getTime()),
          })),
      }));
  });
  onMount(() => {
    const highlightTimer = setTimeout(() => {
      const selectId = new URLSearchParams(location.search).get("selectId");
      if (!selectId) return;

      const target = Array.from(document.querySelectorAll<HTMLElement>("[data-id]")).find(
        (element) => element.dataset.id === selectId,
      );
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.animate(
        [
          { backgroundColor: "color-mix(in srgb, var(--color-accent) 16%, transparent)" },
          { backgroundColor: "transparent" },
        ],
        {
          duration: 1500,
          easing: "ease-in-out",
          fill: "both",
          iterations: 1,
        },
      );
    }, 100);

    return () => clearTimeout(highlightTimer);
  });

  function formatDay(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
    }).format(date);
  }

  function formatMonth(month: number): string {
    const date = new Date(2020, month, 1);
    const cn = new Intl.DateTimeFormat("zh-CN", { month: "long" }).format(date);
    const en = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date).toUpperCase();
    return `${cn} · ${en}`;
  }

  function typeFromFolder(folder: string): string {
    const segments = folder.split("/").filter(Boolean);
    return segments.at(-1) ?? "root";
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-24 pt-7">
    <Masthead />

    <div class="max-w-180 mx-auto mb-8">
      <div class="flex items-start justify-between gap-4">
        <div class="relative inline-block">
          <h1 class="font-serif font-semibold text-7 text-foreground leading-none">note</h1>
          <span class="absolute left-0 -bottom-1.5 h-0.5 w-8 rounded-sm bg-accent"></span>
        </div>
        <a
          href="/note/new"
          class="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          aria-label="New note"><Plus class="size-3" /> new</a
        >
      </div>
      <p class="text-sm text-muted-foreground mt-4">
        Long-form writing — linked, searchable, and always in markdown.
      </p>
    </div>

    <div class="max-w-180 mx-auto mt-6 text-foreground/80">
      {#each groupedEntries as yearGroup}
        <section class="my-5">
          <h2 class="mb-4 text-sm font-medium text-foreground">
            {yearGroup.year}本年
            <span class="ml-1 text-xs text-muted-foreground">{yearGroup.count} 篇</span>
          </h2>

          {#each yearGroup.months as monthSection}
            <section class="mb-4">
              <h3 class="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
                {formatMonth(monthSection.month)}
              </h3>

              <ol class="space-y-1.5">
                {#each monthSection.entries as entry}
                  <li
                    class="grid grid-cols-[2.25rem_minmax(0,1fr)_max-content] gap-3"
                    data-id={entry.id}
                  >
                    <span class="font-mono text-sm leading-5 tabular-nums text-muted-foreground">
                      {formatDay(entry.date)}
                    </span>
                    <a
                      href={entry.href}
                      class="min-w-0 truncate text-sm leading-5 text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
                      title={entry.id}
                    >
                      {entry.title}
                    </a>
                    <span class="text-xs leading-5 text-muted-foreground">
                      {entry.type}
                    </span>
                  </li>
                {/each}
              </ol>
            </section>
          {/each}
        </section>
      {/each}
    </div>
  </div>
</div>
