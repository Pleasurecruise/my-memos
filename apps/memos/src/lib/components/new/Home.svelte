<script lang="ts">
  import { isSameDay, format } from "date-fns";
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import {
    Alert,
    AlertDescription,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
    HeatingRate,
    Timeline,
  } from "@my-memos/ui";
  import type { TimelineGroup } from "@my-memos/ui";
  import { Button } from "@my-memos/ui";
  import {
    Globe,
    Lock,
    Pencil,
    Trash2,
    Check,
    X,
    Star,
    Archive,
    Search,
    Clock3,
    ChevronRight,
  } from "@lucide/svelte";
  import type { Memo, MemoVisibility, TagCount } from "$lib/types";
  import {
    createDeleteActions,
    createEditActions,
    createPinActions,
    createArchiveActions,
  } from "$lib/stores/memo-actions.svelte";
  import { apiCreateMemo } from "$lib/api/memos";
  import { showToast } from "$lib/stores/toast.svelte";
  import { updateQuery } from "$lib/utils";
  import { createTagAutocomplete } from "$lib/stores/tag-autocomplete.svelte";
  import MarkdownContent from "$lib/components/MarkdownContent.svelte";
  import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
  import DeleteDialog from "$lib/components/DeleteDialog.svelte";
  import Masthead from "./Masthead.svelte";

  interface Props {
    memos: Memo[];
    activityMemos: Memo[];
    tags: TagCount[];
    initialSearch: string;
    initialTags: string[];
    viewAsPublic: boolean;
    sortByUpdated: boolean;
    selectedDate: Date | undefined;
  }

  const HEATING_WEEKS = 14;
  const QUOTES = [
    { text: "Beauty that accumulates through repetition, not through display.", author: "蘇芳色" },
    { text: "The surface of things is where meaning hides.", author: "物の哀れ" },
    { text: "A note kept is a thought that survived the morning.", author: "私のノート" },
  ];

  let {
    memos,
    activityMemos,
    tags,
    initialSearch,
    initialTags,
    viewAsPublic,
    sortByUpdated,
    selectedDate,
  }: Props = $props();

  let content = $state("");
  let visibility = $state<MemoVisibility>("private");
  let isSaving = $state(false);
  let composerOpen = $state(false);
  let pinnedOpen = $state(false);
  let error = $state("");
  let search = $state<string | undefined>();

  const del = createDeleteActions();
  const edit = createEditActions();
  const pin = createPinActions();
  const arc = createArchiveActions();

  const tagNames = $derived(tags.map((t) => t.name));
  const ac = createTagAutocomplete(() => tagNames);

  const visLabel = $derived(visibility === "public" ? "Public" : "Private");
  const activeSearch = $derived(search ?? initialSearch);
  const showCardResults = $derived(Boolean(activeSearch.trim()) || sortByUpdated);
  const filtered = $derived(
    memos.filter((m) => {
      if (selectedDate && !isSameDay(new Date(m.updatedAt), selectedDate)) return false;
      if (initialTags.length > 0 && !initialTags.some((t) => m.tags.includes(t))) return false;
      if (!activeSearch) return true;
      return (
        m.content.toLowerCase().includes(activeSearch.toLowerCase()) ||
        m.tags.some((t) => t.includes(activeSearch.toLowerCase()))
      );
    }),
  );
  const pinnedFiltered = $derived(filtered.filter((m) => m.pinned));
  const unpinnedFiltered = $derived(filtered.filter((m) => !m.pinned));
  const grouped = $derived(groupByDay(unpinnedFiltered));
  const timelineContent: TimelineGroup<Memo>[] = $derived(
    grouped.map(([day, items]) => {
      const lbl = dayLabel(day);
      return {
        key: day,
        heading: lbl.h,
        subLabel: lbl.sub,
        isToday: lbl.isToday,
        items,
      };
    }),
  );
  const heatingDays = $derived.by(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (HEATING_WEEKS - 1) * 7);

    const counts = new Map<string, number>();
    for (const memo of activityMemos) {
      const key = format(new Date(memo.createdAt), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from({ length: HEATING_WEEKS * 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = format(d, "yyyy-MM-dd");
      return {
        key,
        label: d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
        value: d <= today ? (counts.get(key) ?? 0) : 0,
      };
    });
  });

  const heatingStats = $derived([
    { label: "entries", value: activityMemos.length },
    { label: "tags in use", value: tags.length },
    { label: "days written", value: groupByDay(activityMemos).length },
  ]);
  const quote = $derived(QUOTES[new Date().getDate() % QUOTES.length]);

  $effect(() => {
    search = initialSearch;
  });

  function groupByDay(items: Memo[]) {
    const map = new Map<string, Memo[]>();
    for (const m of items) {
      const k = format(new Date(m.createdAt), "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }

  function dayLabel(iso: string) {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((base.getTime() - d.getTime()) / 86400000);
    const sub = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (diff === 0) return { h: "today", sub, isToday: true };
    if (diff === 1) return { h: "yesterday", sub, isToday: false };
    return {
      h: d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase(),
      sub,
      isToday: false,
    };
  }

  function timeOnly(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function toggleTag(tag: string) {
    const next = initialTags.includes(tag)
      ? initialTags.filter((t) => t !== tag)
      : [...initialTags, tag];
    updateQuery({ tags: next });
  }

  function syncSearch(value: string) {
    search = value;
    updateQuery({ search: value.trim() || null });
  }

  async function saveMemo() {
    if (!content.trim() || isSaving) return;
    isSaving = true;
    error = "";
    try {
      await apiCreateMemo(content, visibility);
      content = "";
      composerOpen = false;
      ac.close();
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save memo.";
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans overflow-hidden">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-24 pt-7 overflow-y-auto h-full">
    <Masthead {memos} {tags} {viewAsPublic} />

    <!-- TAG STRIP -->
    <div class="flex gap-1.5 overflow-x-auto pb-3.5 mb-4 border-b border-border scrollbar-none">
      <span
        class="font-mono text-[10px] tracking-[0.12em] uppercase text-muted-foreground px-1 py-1 self-center shrink-0"
      >
        tags
      </span>
      {#each tags as { name, count } (name)}
        <button
          type="button"
          onclick={() => toggleTag(name)}
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0 text-xs
            border transition-colors
            {initialTags.includes(name)
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-accent/25 text-accent hover:bg-accent/8'}"
        >
          <span class="opacity-50">#</span>{name}
          <span class="opacity-50 font-mono text-[10px]">{count}</span>
        </button>
      {/each}
    </div>

    <div class="relative md:hidden mb-4">
      <Search
        size={14}
        class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        placeholder="Search memos..."
        value={activeSearch}
        oninput={(e) => syncSearch((e.target as HTMLInputElement).value)}
        class="w-full h-9 pl-9 pr-10 rounded border border-border bg-background text-sm
          text-foreground placeholder:text-muted-foreground outline-none
          focus:border-accent transition-colors"
      />
      <button
        type="button"
        onclick={() => updateQuery({ sort: sortByUpdated ? null : "updated" })}
        class="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded transition-colors {sortByUpdated
          ? 'bg-accent/10 text-accent hover:bg-accent/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
        aria-pressed={sortByUpdated}
        aria-label={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
        title={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
      >
        <Clock3 size={13} />
      </button>
    </div>

    <!-- JOURNAL + RAIL -->
    <div class="grid gap-10 grid-cols-1 md:grid-cols-[1fr_300px]">
      <div>
        {#if composerOpen}
          <div class="relative mb-4">
            <div class="border border-border rounded-lg bg-background shadow-xs overflow-hidden">
              <MarkdownEditor
                bind:value={content}
                ontextchange={(v) => ac.onValueChange(v)}
                onkeydown={(e) => {
                  const next = ac.onKeydown(e);
                  if (next !== null) content = next;
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveMemo();
                }}
                placeholder="A line for the notebook..."
                class="min-h-15"
              />
              <div class="flex items-center gap-2 px-3 py-2.5 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => (visibility = visibility === "public" ? "private" : "public")}
                  class="gap-1.5 font-normal text-muted-foreground"
                >
                  {#if visibility === "public"}<Globe size={11} />{:else}<Lock size={11} />{/if}
                  {visLabel}
                </Button>
                <span class="flex-1"></span>
                <span class="text-xs text-muted-foreground opacity-50 hidden sm:inline"
                  >Cmd+Enter</span
                >
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground"
                  onclick={() => {
                    composerOpen = false;
                    content = "";
                  }}
                >
                  <X size={12} />
                </Button>
                <Button size="sm" disabled={!content.trim() || isSaving} onclick={saveMemo}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
            {#if ac.open && ac.suggestions.length > 0}
              <div
                class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-md z-50 overflow-hidden"
              >
                {#each ac.suggestions as tag, i (tag)}
                  <button
                    type="button"
                    onmousedown={(e) => {
                      e.preventDefault();
                      content = ac.select(tag) ?? content;
                    }}
                    class="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors
                      {i === ac.activeIndex
                      ? 'bg-accent/10 text-accent'
                      : 'text-foreground hover:bg-muted'}"
                  >
                    <span class="text-xs opacity-50">#</span>{tag}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <button
            type="button"
            onclick={() => (composerOpen = true)}
            class="w-full text-left px-4 py-3 rounded border border-dashed border-border
              text-muted-foreground font-serif text-sm italic
              hover:border-accent/40 hover:bg-muted transition-colors mb-4"
          >
            <span class="text-accent mr-1.5"><Pencil size={11} class="inline -mt-0.5" /></span>
            A line for the notebook -- click to write...
          </button>
        {/if}

        {#if error}
          <Alert variant="error" class="flex items-start gap-2 py-2.5 mb-4">
            <AlertDescription class="flex-1">{error}</AlertDescription>
            <button
              onclick={() => (error = "")}
              class="shrink-0 text-error/60 hover:text-error transition-colors"
            >
              <X size={13} />
            </button>
          </Alert>
        {/if}

        {#snippet renderMemo(memo: Memo)}
          {@const isEditing = edit.editingId === memo.id}
          <div>
            <p class="font-mono text-[11px] text-muted-foreground tracking-wide mb-1">
              {timeOnly(sortByUpdated ? memo.updatedAt : memo.createdAt)} · {memo.visibility}
            </p>

            <div
              class="group px-3.5 py-3 rounded-md transition-colors hover:bg-muted border border-transparent hover:border-border"
            >
              {#if memo.pinned && !isEditing}
                <span
                  class="inline-flex items-center gap-1 mb-1.5 font-mono text-[10px] uppercase tracking-widest
                    text-accent px-1.5 py-px rounded border border-accent/30"
                >
                  <Star size={8} fill="currentColor" />pinned
                </span>
              {/if}

              {#if isEditing}
                <MarkdownEditor bind:value={edit.editContent} class="-mx-1 -my-1" />
              {:else}
                <MarkdownContent
                  content={memo.content}
                  stripTags
                  class="max-h-48 overflow-y-auto text-sm leading-relaxed"
                />
              {/if}

              {#if !isEditing && memo.tags.length > 0}
                <div class="flex flex-wrap gap-1.5 mt-2">
                  {#each memo.tags as tag (tag)}
                    <button
                      type="button"
                      onclick={() => toggleTag(tag)}
                      class="inline-flex items-center gap-0.5 px-2 py-px rounded-full text-xs
                        border border-accent/25 text-accent hover:bg-accent/8 transition-colors"
                    >
                      <span class="opacity-50">#</span>{tag}
                    </button>
                  {/each}
                </div>
              {/if}

              <div
                class="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-border
                  opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                {#if isEditing}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="gap-1.5 font-normal text-muted-foreground"
                    onclick={edit.cancel}
                  >
                    <X size={12} />Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="gap-1.5 font-normal text-muted-foreground"
                    onclick={() =>
                      (edit.editVisibility =
                        edit.editVisibility === "public" ? "private" : "public")}
                  >
                    {#if edit.editVisibility === "public"}<Globe size={11} />{:else}<Lock
                        size={11}
                      />{/if}
                    {edit.editVisibility === "public" ? "Public" : "Private"}
                  </Button>
                  <Button
                    size="sm"
                    class="gap-1.5 font-normal ml-auto"
                    disabled={!edit.editContent.trim() || edit.isUpdating}
                    onclick={() => edit.save(memo.id)}
                  >
                    <Check size={12} />{edit.isUpdating ? "Saving..." : "Save"}
                  </Button>
                {:else}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="gap-1.5 font-normal {memo.pinned
                      ? 'text-accent'
                      : 'text-muted-foreground'}"
                    disabled={pin.pinningId === memo.id}
                    onclick={() => pin.toggle(memo)}
                  >
                    <Star size={12} fill={memo.pinned ? "currentColor" : "none"} />
                    {memo.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="gap-1.5 font-normal text-muted-foreground"
                    onclick={() => edit.start(memo)}
                  >
                    <Pencil size={12} />Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="gap-1.5 font-normal text-muted-foreground"
                    disabled={arc.archivingId === memo.id}
                    onclick={() => {
                      if (!page.data.user) {
                        showToast("error", "Please sign in to archive memos");
                        return;
                      }
                      arc.archive(memo.id);
                    }}
                  >
                    <Archive size={12} />{arc.archivingId === memo.id ? "Archiving..." : "Archive"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    class="gap-1.5 font-normal ml-auto"
                    onclick={() => del.request(memo.id)}
                  >
                    <Trash2 size={12} />Delete
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        {/snippet}

        {#if showCardResults}
          <div class="space-y-2">
            {#each filtered as memo (memo.id)}
              {@render renderMemo(memo)}
            {/each}
          </div>
        {:else if pinnedFiltered.length > 0}
          <Collapsible bind:open={pinnedOpen} class="mb-4">
            <CollapsibleTrigger
              class="pinned-trigger w-fit max-w-full rounded px-0.5 py-px font-mono text-xs leading-5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={pinnedOpen ? "Collapse pinned memos" : "Expand pinned memos"}
            >
              <ChevronRight
                size={14}
                class="shrink-0 transition-transform"
                style={`transform: ${pinnedOpen ? "rotate(90deg)" : "rotate(0deg)"}`}
              />
              <code class="text-foreground">pinned</code>
              <span class="min-w-0 truncate">
                {pinnedFiltered.length}
                {pinnedFiltered.length === 1 ? "entry" : "entries"}
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent class="mt-2">
              <div class="space-y-1 pb-1">
                {#each pinnedFiltered as memo (memo.id)}
                  {@render renderMemo(memo)}
                {/each}
              </div>
            </CollapsibleContent>
          </Collapsible>
        {/if}

        {#if !showCardResults}
          <div class="hidden sm:block">
            <Timeline groups={timelineContent}>
              {#snippet children(memo)}
                {@render renderMemo(memo)}
              {/snippet}
            </Timeline>
          </div>

          <div class="space-y-6 sm:hidden">
            {#each timelineContent as group (group.key)}
              <section>
                <div class="flex items-baseline gap-2 px-1 mb-2">
                  <span class="font-serif text-[1.0625rem] font-semibold text-foreground">
                    {group.heading}
                  </span>
                  <span
                    class="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
                  >
                    {group.subLabel}
                  </span>
                </div>
                <div class="space-y-1">
                  {#each group.items as memo (memo.id)}
                    {@render renderMemo(memo)}
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        {/if}

        {#if filtered.length === 0 && !composerOpen}
          <p class="py-20 text-center text-sm text-muted-foreground">No memos found.</p>
        {/if}
      </div>

      <!-- RIGHT: sticky rail (hidden on mobile) -->
      <aside class="hidden md:flex sticky top-8 flex-col gap-4 self-start">
        <!-- quiet thought -->
        <div class="border border-border rounded-lg bg-muted p-4">
          <p class="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            quiet thought
          </p>
          <p class="font-serif italic text-sm leading-relaxed text-foreground">{quote.text}</p>
          <span class="block text-xs text-muted-foreground mt-2">{quote.author}</span>
        </div>

        <HeatingRate
          title="last 14 weeks"
          days={heatingDays}
          stats={heatingStats}
          showRate={false}
        />

        <!-- search -->
        <div class="border border-border rounded-lg bg-background p-4">
          <p class="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            find
          </p>
          <div class="relative">
            <Search
              size={13}
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              placeholder="Search..."
              value={activeSearch}
              oninput={(e) => syncSearch((e.target as HTMLInputElement).value)}
              class="w-full h-8 pl-7 pr-9 rounded border border-border bg-muted text-sm
                text-foreground placeholder:text-muted-foreground outline-none
                focus:border-accent focus:bg-background transition-colors"
            />
            <button
              type="button"
              onclick={() => updateQuery({ sort: sortByUpdated ? null : "updated" })}
              class="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-5.5 w-5.5 items-center justify-center rounded transition-colors {sortByUpdated
                ? 'bg-accent/10 text-accent hover:bg-accent/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
              aria-pressed={sortByUpdated}
              aria-label={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
              title={sortByUpdated ? "Sort by created time" : "Sort by updated time"}
            >
              <Clock3 size={12} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>

<DeleteDialog
  bind:open={del.showDeleteDialog}
  isDeleting={del.isDeleting}
  onConfirm={del.confirm}
  onCancel={del.cancel}
/>
