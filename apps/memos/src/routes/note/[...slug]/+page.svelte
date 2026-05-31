<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { goto } from "$app/navigation";
  import { LoaderCircle, Save, X, Pencil, ArrowLeft } from "@lucide/svelte";
  import { cn } from "@my-memos/ui";
  import ButtonGroup from "$lib/components/ButtonGroup.svelte";
  import ArticleSide from "$lib/components/note/ArticleSide.svelte";
  import { apiUpdateNote } from "$lib/notes-client";
  import Masthead from "$lib/components/new/Masthead.svelte";
  import ArticleHeader from "$lib/components/note/ArticleHeader.svelte";
  import NoteEditor from "$lib/components/note/NoteEditor.svelte";
  import NoteToc from "$lib/components/note/NoteToc.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let mode = $state<"preview" | "edit">("preview");
  let draftMarkdown = $state("");
  let isSaving = $state(false);
  let error = $state("");
  let savedNote = $state<PageData | null>(null);
  const isEditing = $derived(mode === "edit");
  const display = $derived(savedNote ?? data);

  function toggleEdit() {
    if (mode === "preview") {
      draftMarkdown = display.source;
      mode = "edit";
    } else {
      mode = "preview";
    }
  }

  async function saveNote() {
    if (isSaving) return;
    isSaving = true;
    error = "";

    try {
      const result = await apiUpdateNote(display.slug, draftMarkdown);
      savedNote = { ...display, ...result.note };
      draftMarkdown = result.note.source;
      mode = "preview";
      await invalidateAll();
      savedNote = null;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to save note.";
    } finally {
      isSaving = false;
    }
  }

  function cancelEdit() {
    draftMarkdown = display.source;
    error = "";
    mode = "preview";
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
                  disabled={isSaving || !draftMarkdown.trim()}
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
            onmarkdownchange={(value) => (draftMarkdown = value)}
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
