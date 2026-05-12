<script lang="ts">
  import AppShell from "$lib/components/AppShell.svelte";
  import ArchiveContent from "$lib/components/ArchiveContent.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let selectedDate = $state<Date | undefined>(undefined);

  $effect(() => {
    selectedDate = data.filters.date ? new Date(`${data.filters.date}T00:00:00`) : undefined;
  });
</script>

<AppShell
  tags={data.tags}
  activeTags={data.filters.tags}
  {selectedDate}
  onDateChange={(d) => (selectedDate = d)}
>
  <ArchiveContent memos={data.memos} initialTags={data.filters.tags} {selectedDate} />
</AppShell>
