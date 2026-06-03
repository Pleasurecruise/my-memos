<script lang="ts">
  import VisualFrame from "./VisualFrame.svelte";

  interface Props {
    /** Chart code (HTML fragment with style + canvas/div + script). */
    code: string;
    /** Display title. */
    title: string;
    /** Width in pixels. Default 720. */
    width?: number;
    /** Height in pixels. Default 360. */
    height?: number;
    /** When true, scripts are deferred until streaming=false. */
    streaming?: boolean;
    /** Additional CSS class on the wrapper. */
    class?: string;
  }

  let {
    code,
    title,
    width = 720,
    height = 360,
    streaming = false,
    class: extraClass = "",
  }: Props = $props();
</script>

<VisualFrame {title} {code} {streaming} {width} {height} class={extraClass} />
