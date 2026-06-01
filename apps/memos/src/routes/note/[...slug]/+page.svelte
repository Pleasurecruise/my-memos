<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { ArrowLeft, LoaderCircle, Pencil, Save, Trash2, X } from "@lucide/svelte";
  import {
    cn,
    Input,
    Select,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
  } from "@my-memos/ui";
  import ButtonGroup from "$lib/components/ButtonGroup.svelte";
  import ArticleSide from "$lib/components/note/ArticleSide.svelte";

  import { apiCreateNote, apiDeleteNote, apiUpdateNote } from "$lib/notes-client";
  import { categoryFromSlug, encodeSlug } from "$lib/utils/url";
  import Masthead from "$lib/components/new/Masthead.svelte";
  import ArticleHeader from "$lib/components/note/ArticleHeader.svelte";
  import NoteEditor from "$lib/components/note/NoteEditor.svelte";
  import NoteToc from "$lib/components/note/NoteToc.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const NEW_CATEGORY_VALUE = "__new__";

  let mode = $state<"preview" | "edit">("preview");
  let draftMarkdown = $state("");
  let isSaving = $state(false);
  let deleting = $state(false);
  let showDeleteDialog = $state(false);
  let showUnsavedDialog = $state(false);
  let error = $state("");
  let savedNote = $state<PageData | null>(null);
  let draftTitle = $state("");
  let selectedCategory = $state("");
  let newCategory = $state("");
  let initializedSlug = $state("");

  const isEditing = $derived(mode === "edit");
  const display = $derived(savedNote ?? data);
  const isNew = $derived(display.slug === "new");
  let editorReady = $state(false);
  let baselineMarkdown = $state("");
  const hasUnsavedChanges = $derived(
    editorReady &&
      mode === "edit" &&
      (draftTitle !== display.title || draftMarkdown !== baselineMarkdown),
  );
  const categoryOptions = $derived(
    [...new Set([data.defaultCategory, ...display.categories])].sort((a, b) => a.localeCompare(b)),
  );
  const categoryValue = $derived(
    selectedCategory === NEW_CATEGORY_VALUE ? newCategory.trim() : selectedCategory.trim(),
  );
  const resolvedCategory = $derived(categoryValue || data.defaultCategory);

  $effect(() => {
    if (initializedSlug === display.slug) return;
    initializedSlug = display.slug;
    selectedCategory = isNew ? "" : (categoryFromSlug(display.slug) ?? data.defaultCategory);
    newCategory = "";
    if (isNew) {
      mode = "edit";
      draftTitle = display.title;
      draftMarkdown = display.source;
      baselineMarkdown = display.source;
      editorReady = false;
    }
  });

  $effect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  });

  function toggleEdit() {
    if (mode === "preview") {
      draftTitle = display.title;
      draftMarkdown = display.source;
      selectedCategory = categoryFromSlug(display.slug) ?? data.defaultCategory;
      newCategory = "";
      baselineMarkdown = display.source;
      editorReady = false;
      mode = "edit";
    } else if (hasUnsavedChanges) {
      showUnsavedDialog = true;
    } else {
      mode = "preview";
    }
  }

  async function saveNote() {
    if (isSaving || !draftTitle.trim()) return;
    isSaving = true;
    error = "";
    const creating = isNew;

    try {
      const result = creating
        ? await apiCreateNote({
            body: draftMarkdown,
            title: draftTitle,
            category: resolvedCategory,
          })
        : await apiUpdateNote(display.slug, {
            body: draftMarkdown,
            title: draftTitle,
            category: resolvedCategory,
          });

      savedNote = { ...display, ...result.note };
      draftMarkdown = result.note.source;
      mode = "preview";
      if (creating) {
        await goto(`/note?selectId=${encodeURIComponent(result.note.slug)}`);
      } else if (result.note.slug !== display.slug) {
        await invalidateAll();
        await goto(`/note/${encodeSlug(result.note.slug)}`, { replaceState: creating });
      } else {
        await invalidateAll();
        savedNote = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save note.";
    } finally {
      isSaving = false;
    }
  }

  function cancelEdit() {
    if (hasUnsavedChanges) {
      showUnsavedDialog = true;
      return;
    }
    discardChanges();
  }

  function discardChanges() {
    draftTitle = display.title;
    draftMarkdown = display.source;
    selectedCategory = categoryFromSlug(display.slug) ?? data.defaultCategory;
    newCategory = "";
    error = "";
    showUnsavedDialog = false;
    if (isNew) {
      goto("/note");
    } else {
      mode = "preview";
    }
  }

  async function confirmDelete() {
    if (deleting || isNew) return;
    deleting = true;
    error = "";

    try {
      await apiDeleteNote(display.slug);
      await goto("/note");
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete note.";
      showDeleteDialog = false;
    } finally {
      deleting = false;
    }
  }
</script>

<div class="min-h-screen bg-background text-foreground font-sans">
  <div class="max-w-280 mx-auto px-4 sm:px-8 pb-20 sm:pb-24 pt-5 sm:pt-7">
    <Masthead />

    <section id="note" class={cn("mx-auto mt-6 w-full sm:mt-8", !isEditing && "max-w-162.5")}>
      <div>
        <div class="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
          <div class="min-w-0 flex-1">
            <ArticleHeader title={display.title} text={display.excerpt} />
          </div>

          <div class="flex items-center">
            {#if isEditing}
              <ButtonGroup>
                {#if !isNew}
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
                    onclick={() => (showDeleteDialog = true)}
                    disabled={isSaving || deleting}
                    aria-label="delete"
                  >
                    <Trash2 class="size-4" />
                  </button>
                {/if}
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  onclick={cancelEdit}
                  disabled={isSaving}
                  aria-label="cancel"
                >
                  <X class="size-4" />
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center border border-border bg-foreground text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  onclick={saveNote}
                  disabled={isSaving || !draftTitle.trim()}
                  aria-label="save"
                >
                  {#if isSaving}
                    <LoaderCircle class="size-4 animate-spin" />
                  {:else}
                    <Save class="size-4" />
                  {/if}
                </button>
              </ButtonGroup>
            {:else}
              <ButtonGroup class="xl:hidden">
                <button
                  type="button"
                  onclick={toggleEdit}
                  class="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Edit"><Pencil class="size-4" /></button
                >
                <button
                  type="button"
                  onclick={() => goto("/note")}
                  class="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="All notes"><ArrowLeft class="size-4" /></button
                >
              </ButtonGroup>
            {/if}
          </div>
        </div>

        {#if !isEditing}
          <NoteToc entries={display.toc} />
        {:else}
          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr] sm:max-w-100">
            <div class="grid gap-2">
              <label
                for="note-title"
                class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                title
              </label>
              <Input
                id="note-title"
                placeholder="Untitled note"
                value={draftTitle}
                oninput={(e) => (draftTitle = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="grid gap-2">
              <label
                for="note-category"
                class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                category
              </label>
              <Select
                id="note-category"
                value={selectedCategory}
                onchange={(e) => {
                  selectedCategory = (e.target as HTMLSelectElement).value;
                  if (selectedCategory !== NEW_CATEGORY_VALUE) newCategory = "";
                }}
              >
                <option value="">Select category...</option>
                {#each categoryOptions as category (category)}
                  <option value={category}>{category}</option>
                {/each}
                <option value={NEW_CATEGORY_VALUE}>New category...</option>
              </Select>
              {#if selectedCategory === NEW_CATEGORY_VALUE}
                <Input
                  placeholder={data.defaultCategory}
                  value={newCategory}
                  oninput={(e) => (newCategory = (e.target as HTMLInputElement).value)}
                />
              {/if}
            </div>
          </div>
        {/if}
      </div>

      {#if error}
        <p class="mt-4 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          {error}
        </p>
      {/if}

      {#if isEditing}
        <div class="mt-6 sm:mt-8">
          <NoteEditor
            html={display.editorHtml}
            onmarkdownchange={(value) => {
              draftMarkdown = value;
              if (!editorReady) {
                baselineMarkdown = value;
                editorReady = true;
              }
            }}
          />
        </div>
      {:else}
        <article class="article mt-6 sm:mt-8">
          {@html display.html}
        </article>
      {/if}
    </section>

    {#if !isEditing}
      <ArticleSide {isEditing} onedit={toggleEdit} />
    {/if}
  </div>
</div>

<Dialog bind:open={showDeleteDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this note?</DialogTitle>
      <DialogDescription
        >This action cannot be undone. The note will be permanently removed.</DialogDescription
      >
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (showDeleteDialog = false)} disabled={deleting}
        >Cancel</Button
      >
      <Button variant="destructive" onclick={confirmDelete} disabled={deleting}>
        {deleting ? "Deleting…" : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog bind:open={showUnsavedDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Discard unsaved changes?</DialogTitle>
      <DialogDescription>
        You have unsaved changes to this note. If you leave now, your changes will be lost.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (showUnsavedDialog = false)}>Cancel</Button>
      <Button variant="destructive" onclick={discardChanges}>Discard</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
