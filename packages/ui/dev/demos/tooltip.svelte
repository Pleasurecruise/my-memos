<script module lang="ts">
  export const title = "Tooltip";
</script>

<script lang="ts">
  import { Info } from "@lucide/svelte";
  import { Tooltip, Button } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "content",
      type: "string",
      description: "Text displayed inside the tooltip.",
    },
    {
      name: "side",
      type: '"top" | "bottom" | "left" | "right"',
      default: '"top"',
      description: "Which side the tooltip appears on.",
    },
    {
      name: "delay",
      type: "number",
      default: "300",
      description: "Delay in milliseconds before the tooltip shows.",
    },
    {
      name: "children",
      type: "Snippet",
      description: "The element that triggers the tooltip on hover / focus.",
    },
  ];

  const usage = `import { Tooltip, Button } from "@my-memos/ui";

<Tooltip content="Save your memo">
  <Button>Save</Button>
</Tooltip>

<Tooltip content="Opens below" side="bottom">
  <Button variant="outline">Hover me</Button>
</Tooltip>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Sides</SectionLabel>
    <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap; padding: 24px 0;">
      <Tooltip content="Tooltip on top" side="top">
        <Button variant="outline">Top</Button>
      </Tooltip>
      <Tooltip content="Tooltip on bottom" side="bottom">
        <Button variant="outline">Bottom</Button>
      </Tooltip>
      <Tooltip content="Tooltip on left" side="left">
        <Button variant="outline">Left</Button>
      </Tooltip>
      <Tooltip content="Tooltip on right" side="right">
        <Button variant="outline">Right</Button>
      </Tooltip>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With different triggers</SectionLabel>
    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
      <Tooltip content="Default button">
        <Button>Default</Button>
      </Tooltip>
      <Tooltip content="Ghost button">
        <Button variant="ghost">Ghost</Button>
      </Tooltip>
      <Tooltip content="More information" side="bottom">
        <Button variant="outline" size="icon">
          <Info size={15} />
        </Button>
      </Tooltip>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Delay</SectionLabel>
    <div style="display: flex; gap: 16px; align-items: center;">
      <Tooltip content="Appears instantly" delay={0}>
        <Button variant="secondary">No delay</Button>
      </Tooltip>
      <Tooltip content="500 ms delay" delay={500}>
        <Button variant="secondary">Slow (500ms)</Button>
      </Tooltip>
    </div>
  </section>
</DemoPage>
