<script lang="ts">
  import { FRAME_SHELL } from "$lib/visual/shell";

  interface Props {
    title: string;
    code: string | undefined;
    streaming: boolean;
    width?: number;
    height?: number;
    class?: string;
  }

  let {
    title,
    code,
    streaming,
    width = 720,
    height = 400,
    class: extraClass = "",
  }: Props = $props();
  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let ready = $state(false);
  let rafId: number | null = null;
  let pendingCode: string | undefined;
  let flushed = false;

  const iframeLoaded = () => {
    ready = true;
  };

  function sendContent(html: string, final: boolean) {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage({ type: "content", html, final }, "*");
  }

  // Progressive morph during streaming: RAF-coalesce to at most 1 push per frame
  $effect(() => {
    if (!ready || !iframeEl?.contentWindow || !code) return;

    pendingCode = code;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingCode !== undefined && iframeEl?.contentWindow) {
          sendContent(pendingCode, false);
          pendingCode = undefined;
        }
      });
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });

  // Final flush: cancel pending RAF, push final content, execute scripts (once)
  $effect(() => {
    if (streaming || !ready || !iframeEl?.contentWindow || !code) return;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      pendingCode = undefined;
    }
    if (!flushed) {
      flushed = true;
      sendContent(code, true);
    }
  });

  // Reset flushed flag when streaming restarts (new chart generation)
  $effect(() => {
    if (streaming) flushed = false;
  });
</script>

<iframe
  bind:this={iframeEl}
  {title}
  srcdoc={FRAME_SHELL}
  sandbox="allow-scripts"
  onload={iframeLoaded}
  style="--frame-h:{height}px"
  class="w-full block overflow-hidden rounded-lg border-none bg-background h-(--frame-h) {extraClass}"
></iframe>
