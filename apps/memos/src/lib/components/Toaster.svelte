<script lang="ts">
  import { fly } from "svelte/transition";
  import { Toast } from "@my-memos/ui";
  import { toasts, dismiss } from "$lib/stores/toast.svelte";
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
  {#each toasts as toast (toast.id)}
    <div class="pointer-events-auto" transition:fly={{ y: 8, duration: 200 }}>
      <button
        type="button"
        onclick={() => dismiss(toast.id)}
        class="block text-left cursor-pointer"
      >
        <Toast variant={toast.variant} title={toast.title} description={toast.description} />
      </button>
    </div>
  {/each}
</div>
