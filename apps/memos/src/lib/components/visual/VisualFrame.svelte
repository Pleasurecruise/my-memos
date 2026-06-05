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
  let contentHeight = $state(0);
  let rafId: number | null = null;
  let pendingCode: string | undefined;
  let flushed = false;

  const resolvedHeight = $derived(streaming ? height : Math.max(height, contentHeight));

  function iframeLoaded() {
    ready = true;
  }

  function sendContent(html: string, final: boolean) {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage({ type: "content", html, final }, "*");
  }

  function handleMessage(event: MessageEvent) {
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type !== "resize" || typeof event.data.height !== "number") return;
    if (event.source !== iframeEl?.contentWindow) return;
    contentHeight = Math.max(height, Math.ceil(event.data.height));
  }

  $effect(() => {
    contentHeight = height;
  });

  $effect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });

  // --- Streaming: RAF-coalesced progressive morph ---
  $effect(() => {
    if (!ready || !iframeEl?.contentWindow || !code || !streaming) return;

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

  // --- Final flush: cancel pending RAF, send final content, execute scripts ---
  $effect(() => {
    if (streaming) {
      flushed = false;
      return;
    }
    if (!ready || !iframeEl?.contentWindow || !code) return;

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
</script>

<iframe
  bind:this={iframeEl}
  {title}
  srcdoc={FRAME_SHELL}
  sandbox="allow-scripts"
  onload={iframeLoaded}
  style="--frame-h:{resolvedHeight}px"
  class="w-full block overflow-hidden rounded-lg border-none bg-background h-(--frame-h) transition-[height] duration-200 {extraClass}"
></iframe>
