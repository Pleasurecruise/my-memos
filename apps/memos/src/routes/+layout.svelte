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

  const pageTitle = $derived(
    $page.data.meta?.title ? `${$page.data.meta.title} — ${SITE_NAME}` : SITE_NAME,
  );
  const pageDescription = $derived($page.data.meta?.description ?? DEFAULT_DESCRIPTION);
  const canonicalUrl = $derived(`${$page.url.origin}${$page.url.pathname}`);
</script>

<svelte:head>
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:url" content={canonicalUrl} />
  <title>{pageTitle}</title>
  <meta property="og:title" content={pageTitle} />
  <meta name="description" content={pageDescription} />
  <meta property="og:description" content={pageDescription} />
  {#if $page.data.meta?.ogImage}
    <meta property="og:image" content={$page.data.meta.ogImage} />
    <meta property="og:image:secure_url" content={$page.data.meta.ogImage} />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content={$page.data.meta?.title ?? SITE_NAME} />
    <meta name="twitter:image" content={$page.data.meta.ogImage} />
    <meta name="twitter:image:alt" content={$page.data.meta?.title ?? SITE_NAME} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  {/if}
  <meta property="og:type" content={$page.data.meta?.ogType ?? "website"} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  {#if $page.data.meta?.robots}
    <meta name="robots" content={$page.data.meta.robots} />
  {/if}
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
