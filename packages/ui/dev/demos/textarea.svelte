<script module lang="ts">
  export const title = "Textarea";
</script>

<script lang="ts">
  import { Textarea, Label } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "error",
      type: "boolean",
      default: "false",
      description: "Switches border and focus ring to the error colour.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"textarea">',
      description: "All native textarea attributes.",
    },
  ];

  const usage = `import { Textarea } from "@my-memos/ui";

<Textarea placeholder="Write something…" />
<Textarea error placeholder="This field has an error" />`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Default</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 20px; max-width: 400px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <Label for="ta-default">Message</Label>
        <Textarea id="ta-default" placeholder="Write something…" />
      </div>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>States</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
      <Textarea placeholder="Default state" />
      <Textarea error placeholder="Error state" />
      <Textarea disabled placeholder="Disabled state" />
    </div>
  </section>
</DemoPage>