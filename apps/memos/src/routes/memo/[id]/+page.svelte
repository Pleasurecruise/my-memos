<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let { data }: { data: { memo: { id: string } } } = $props();

  onMount(() => {
    void goto(`/#memo-${data.memo.id}`, {
      replaceState: true,
      noScroll: true,
    });
  });
</script>
