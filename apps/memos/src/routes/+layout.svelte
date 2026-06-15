<script lang="ts">
  import type { Snippet } from "svelte";
  import { fly } from "svelte/transition";
  import { page } from "$app/stores";
  import "../app.css";
  import { Toast } from "@my-memos/ui";
  import { toasts, dismiss } from "$lib/state/toast.svelte";

  let { children }: { children: Snippet } = $props();

  const SITE_NAME = "My Memos";
  const DEFAULT_DESCRIPTION = "A warm, minimal memo space.";
</script>

<svelte:head>
  <meta property="og:site_name" content={SITE_NAME} />
  {#if $page.data.meta?.title}
    <title>{$page.data.meta.title} — {SITE_NAME}</title>
    <meta property="og:title" content="{$page.data.meta.title} — {SITE_NAME}" />
  {:else}
    <title>{SITE_NAME}</title>
    <meta property="og:title" content={SITE_NAME} />
  {/if}
  {#if $page.data.meta?.description}
    <meta name="description" content={$page.data.meta.description} />
    <meta property="og:description" content={$page.data.meta.description} />
  {:else}
    <meta name="description" content={DEFAULT_DESCRIPTION} />
    <meta property="og:description" content={DEFAULT_DESCRIPTION} />
  {/if}
  {#if $page.data.meta?.ogImage}
    <meta property="og:image" content={$page.data.meta.ogImage} />
  {/if}
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content={$page.data.meta?.ogType ?? "website"} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{@render children()}

<div class="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
  {#each toasts as toast (toast.id)}
    <div class="pointer-events-auto" transition:fly={{ y: 8, duration: 200 }}>
      <button
        type="button"
        onclick={() => dismiss(toast.id)}
        class="block cursor-pointer text-left"
      >
        <Toast variant={toast.variant} title={toast.title} description={toast.description} />
      </button>
    </div>
  {/each}
</div>
