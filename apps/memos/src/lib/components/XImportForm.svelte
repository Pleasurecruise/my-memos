<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { Button } from "@my-memos/ui";
  import { Globe, Lock } from "@lucide/svelte";
  import { apiImportXPost } from "$lib/services/memos";
  import { showToast } from "$lib/state/toast.svelte";
  import type { MemoVisibility } from "$lib/types";

  let url = $state("");
  let visibility = $state<MemoVisibility>("private");
  let importing = $state(false);
  let error = $state("");

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!url.trim() || importing) return;

    importing = true;
    error = "";
    apiImportXPost(url, visibility)
      .then(
        async (result) => {
          if (!result.success) {
            error = result.error;
            return;
          }

          await invalidateAll();
          url = "";
          showToast("success", "X post imported to favorites");
        },
        () => {
          error = "Could not reach the X import service.";
        },
      )
      .finally(() => {
        importing = false;
      });
  }
</script>

<form class="mb-8" onsubmit={submit}>
  <div class="flex gap-2">
    <input
      bind:value={url}
      type="url"
      inputmode="url"
      autocomplete="off"
      placeholder="Paste an X post URL..."
      aria-label="X post URL"
      class="min-w-0 flex-1 h-9 px-3 rounded border border-border bg-background text-sm
        text-foreground placeholder:text-muted-foreground outline-none
        focus:border-accent transition-colors"
    />
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="gap-1.5 font-normal text-muted-foreground max-sm:px-2"
      onclick={() => (visibility = visibility === "private" ? "public" : "private")}
      aria-label="Import visibility: {visibility}"
      title="Import as {visibility}"
    >
      {#if visibility === "private"}<Lock size={12} />{:else}<Globe size={12} />{/if}
      <span class="hidden sm:inline">{visibility === "private" ? "Private" : "Public"}</span>
    </Button>
    <Button type="submit" variant="outline" size="sm" disabled={!url.trim() || importing}>
      {importing ? "Importing..." : "Import"}
    </Button>
  </div>
  {#if error}
    <p class="mt-2 text-xs text-error">{error}</p>
  {/if}
</form>
