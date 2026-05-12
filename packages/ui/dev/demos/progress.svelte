<script module lang="ts">
  export const title = "Progress";
</script>

<script lang="ts">
  import { Progress } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "value",
      type: "number",
      default: "0",
      description: "Progress percentage, 0–100. Clamped automatically.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"div">',
      description: "All native div attributes.",
    },
  ];

  const usage = `import { Progress } from "@my-memos/ui";

<Progress value={72} />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Values</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 14px; max-width: 400px;">
      <Progress value={0} />
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={72} />
      <Progress value={100} />
    </div>
  </section>
</DemoPage>
