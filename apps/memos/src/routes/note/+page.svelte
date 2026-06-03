<script lang="ts">
  import NewNote from "$lib/components/views/Note.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<NewNote paths={data.paths} fileMeta={data.fileMeta} />
