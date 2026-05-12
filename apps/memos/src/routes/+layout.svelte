<script lang="ts">
  import type { Snippet } from "svelte";
  import "../app.css";
  import Toaster from "$lib/components/Toaster.svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
<Toaster />
