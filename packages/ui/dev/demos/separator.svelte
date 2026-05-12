<script module lang="ts">
  export const title = "Separator";
</script>

<script lang="ts">
  import { Separator } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
      description: "Direction of the separator line.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Separator } from "@my-memos/ui";

<Separator />
<Separator orientation="vertical" style={{ height: 20 }} />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Horizontal</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px;">
      <p style="font-size: 13px; color: var(--color-foreground);">Above the line</p>
      <Separator />
      <p style="font-size: 13px; color: var(--color-foreground);">Below the line</p>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Vertical</SectionLabel>
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 13px; color: var(--color-foreground);">Left</span>
      <Separator orientation="vertical" style="height: 16px;" />
      <span style="font-size: 13px; color: var(--color-foreground);">Center</span>
      <Separator orientation="vertical" style="height: 16px;" />
      <span style="font-size: 13px; color: var(--color-foreground);">Right</span>
    </div>
  </section>
</DemoPage>
