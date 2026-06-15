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
    Toast,
    type ToastVariant,
  } from "@my-memos/ui";
  import ButtonGroup from "$lib/components/ButtonGroup.svelte";
  import { VisualBlock } from "$lib/components/visual";
  import ArticleSide from "$lib/components/note/ArticleSide.svelte";

  import { apiCreateNote, apiDeleteNote, apiUpdateNote } from "$lib/services/notes";
  import { categoryFromSlug, encodeSlug } from "$lib/utils/url";
  import Masthead from "$lib/components/layout/Masthead.svelte";
  import ArticleHeader from "$lib/components/note/ArticleHeader.svelte";
  import NoteEditor from "$lib/components/note/NoteEditor.svelte";
  import NoteToc from "$lib/components/note/NoteToc.svelte";
  import { splitVisualBlockHtml } from "$lib/visual/blocks";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const NEW_CATEGORY_VALUE = "__new__";

  let mode = $state<"preview" | "edit">("preview");
  let draftMarkdown = $state("");
  let isSaving = $state(false);
  let deleting = $state(false);
  let showDeleteDialog = $state(false);
  let showUnsavedDialog = $state(false);
  let toastVisible = $state(false);
  let toastTitle = $state("");
  let toastVariant = $state<ToastVariant>("success");
  let toastTimer = $state<ReturnType<typeof setTimeout> | null>(null);
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
    [...new Set(display.categories)].sort((a, b) => a.localeCompare(b)),
  );
  const categoryValue = $derived(
    selectedCategory === NEW_CATEGORY_VALUE ? newCategory.trim() : selectedCategory.trim(),
  );
  const resolvedCategory = $derived(categoryValue || data.defaultCategory);
  const articleParts = $derived(splitVisualBlockHtml(display.html, display.visualBlocks ?? []));

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

      const oldSlug = display.slug;
      draftMarkdown = result.note.source;

      showToast("Note saved", "success");

      if (creating) {
        await goto(`/note?selectId=${encodeURIComponent(result.note.slug)}`);
      } else if (result.note.slug !== oldSlug) {
        savedNote = { ...display, ...result.note };
        mode = "preview";
        await goto(`/note/${encodeSlug(result.note.slug)}`, { replaceState: creating });
      } else {
        savedNote = { ...display, ...result.note };
        mode = "preview";
        await invalidateAll();
        savedNote = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save note.";
    } finally {
      isSaving = false;
    }
  }

  function showToast(title: string, variant: ToastVariant) {
    if (toastTimer) clearTimeout(toastTimer);
    toastTitle = title;
    toastVariant = variant;
    toastVisible = true;
    toastTimer = setTimeout(() => {
      toastVisible = false;
    }, 2500);
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

          {#if isEditing}
            <div class="flex items-center">
              <ButtonGroup>
                {#if !isNew}
                  <Button
                    size="icon"
                    variant="destructive"
                    class="h-8 w-8"
                    onclick={() => (showDeleteDialog = true)}
                    disabled={isSaving || deleting}
                    aria-label="delete"
                  >
                    <Trash2 class="size-4" />
                  </Button>
                {/if}
                <Button
                  size="icon"
                  variant="outline"
                  class="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onclick={cancelEdit}
                  disabled={isSaving}
                  aria-label="cancel"
                >
                  <X class="size-4" />
                </Button>
                <Button
                  size="icon"
                  class="h-8 w-8 bg-foreground text-background hover:bg-foreground hover:opacity-90"
                  onclick={saveNote}
                  disabled={isSaving || !draftTitle.trim()}
                  aria-label="save"
                >
                  {#if isSaving}
                    <LoaderCircle class="size-4 animate-spin" />
                  {:else}
                    <Save class="size-4" />
                  {/if}
                </Button>
              </ButtonGroup>
            </div>
          {:else}
            <div class="xl:hidden flex items-center">
              <ButtonGroup>
                <Button
                  size="icon"
                  variant="outline"
                  class="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onclick={toggleEdit}
                  aria-label="Edit"
                >
                  <Pencil class="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  class="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onclick={() => goto("/note")}
                  aria-label="All notes"
                >
                  <ArrowLeft class="size-4" />
                </Button>
              </ButtonGroup>
            </div>
          {/if}
        </div>

        {#if !isEditing}
          <NoteToc entries={display.toc} />
        {:else}
          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[3fr_2fr] sm:max-w-140">
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
              <div class="flex gap-2">
                <Select
                  id="note-category"
                  class="flex-1"
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
                  <option value={data.defaultCategory}>不进行分类</option>
                  <option value={NEW_CATEGORY_VALUE}>新增类别</option>
                </Select>
                {#if selectedCategory === NEW_CATEGORY_VALUE}
                  <Input
                    class="flex-1"
                    placeholder={data.defaultCategory}
                    value={newCategory}
                    oninput={(e) => (newCategory = (e.target as HTMLInputElement).value)}
                  />
                {/if}
              </div>
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
        <div class="mt-6 grid gap-6 sm:mt-8 sm:gap-8 min-w-0">
          {#each articleParts as part}
            {#if part.type === "html"}
              <article class="article min-w-0">
                {@html part.html}
              </article>
            {:else}
              <VisualBlock block={part.block} />
            {/if}
          {/each}
        </div>
      {/if}
    </section>

    {#if !isEditing}
      <ArticleSide onedit={toggleEdit} />
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

<div
  class="fixed bottom-6 right-6 z-50 transition-all duration-300"
  class:pointer-events-none={!toastVisible}
  class:translate-y-2={!toastVisible}
  class:opacity-0={!toastVisible}
>
  <Toast variant={toastVariant} title={toastTitle} />
</div>
