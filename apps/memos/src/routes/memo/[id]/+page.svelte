<script lang="ts">
  import { onMount } from "svelte";

  let { data }: { data: { memo: { id: string } } } = $props();

  onMount(() => {
    window.location.replace(`/#memo-${data.memo.id}`);
  });
</script>
