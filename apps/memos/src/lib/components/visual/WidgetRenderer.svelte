<script lang="ts">
  import VisualFrame from "./VisualFrame.svelte";

  interface Props {
    /** Widget HTML fragment (style + content + script). */
    code: string;
    /** Display title (snake_case converted to sentence case by caller). */
    title: string;
    /** Width in pixels. Default 800. */
    width?: number;
    /** Height in pixels. Default 500. */
    height?: number;
    /** When true, scripts are deferred until streaming=false. */
    streaming?: boolean;
    /** Additional CSS class on the wrapper. */
    class?: string;
  }

  let {
    code,
    title,
    width = 800,
    height = 500,
    streaming = false,
    class: extraClass = "",
  }: Props = $props();
</script>

<VisualFrame {title} {code} {streaming} {width} {height} class={extraClass} />
