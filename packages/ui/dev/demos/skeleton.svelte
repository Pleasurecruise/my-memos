<script module lang="ts">
  export const title = "Skeleton";
</script>

<script lang="ts">
  import { Skeleton } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const usage = `import { Skeleton } from "@my-memos/ui";

<Skeleton style={{ height: 16, width: 200 }} />
<Skeleton style={{ height: 16, width: "100%" }} />`;
</script>

<DemoPage {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Lines</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px;">
      <Skeleton style="height: 14px; width: 80%;" />
      <Skeleton style="height: 14px; width: 100%;" />
      <Skeleton style="height: 14px; width: 60%;" />
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Card skeleton</SectionLabel>
    <div
      style="width: 320px; border: 1px solid var(--color-border); border-radius: 8px; padding: 24px; display: flex; flex-direction: column; gap: 16px;"
    >
      <div style="display: flex; align-items: center; gap: 12px;">
        <Skeleton style="height: 36px; width: 36px; border-radius: 50%;" />
        <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
          <Skeleton style="height: 13px; width: 55%;" />
          <Skeleton style="height: 11px; width: 35%;" />
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <Skeleton style="height: 12px; width: 100%;" />
        <Skeleton style="height: 12px; width: 90%;" />
        <Skeleton style="height: 12px; width: 75%;" />
      </div>
      <Skeleton style="height: 32px; width: 96px; border-radius: 6px;" />
    </div>
  </section>
</DemoPage>