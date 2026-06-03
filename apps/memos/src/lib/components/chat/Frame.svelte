<script lang="ts">
  import { onMount } from "svelte";
  import { FRAME_SHELL } from "$lib/chat/shell";

  interface Props {
    title: string;
    code: string | undefined;
    streaming: boolean;
    width?: number;
    height?: number;
  }

  let { title, code, streaming, width = 720, height = 400 }: Props = $props();
  let iframeEl = $state<HTMLIFrameElement | null>(null);
  let ready = $state(false);
  let sent = "";
  let timer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    // ready when iframe's srcdoc scripts have executed
    iframeEl?.addEventListener("load", () => (ready = true));
  });

  function pushContent(html: string) {
    if (!iframeEl?.contentWindow) return;
    iframeEl.contentWindow.postMessage({ type: "setContent", html }, "*");
    sent = html;
  }

  // Debounced content push during streaming
  $effect(() => {
    if (!ready || !iframeEl?.contentWindow) return;
    if (!code || code === sent) return;

    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (!iframeEl?.contentWindow) return;
      pushContent(code);
    }, 150);
  });

  // Flush on streaming end + execute scripts
  $effect(() => {
    if (streaming || !ready || !iframeEl?.contentWindow || !code) return;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pushContent(code);
    iframeEl.contentWindow.postMessage({ type: "runScripts" }, "*");
  });
</script>

<iframe
  bind:this={iframeEl}
  {title}
  srcdoc={FRAME_SHELL}
  sandbox="allow-scripts"
  scrolling="no"
  style="display:block;width:100%;height:{height}px;border:none;border-radius:8px;background:var(--color-background)"
></iframe>
