<script module lang="ts">
  export const title = "Label";
</script>

<script lang="ts">
  import { Label, Input } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "required",
      type: "boolean",
      default: "false",
      description: "Appends a red asterisk to indicate the field is required.",
    },
    {
      name: "...props",
      type: 'ComponentProps<"label">',
      description: "All native label attributes.",
    },
  ];

  const usage = `import { Label, Input } from "@my-memos/ui";

<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
  <Label for="email" required>Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>With Input</SectionLabel>
    <div style="display: flex; flex-direction: column; gap: 20px; max-width: 320px;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <Label for="demo-name">Full name</Label>
        <Input id="demo-name" placeholder="Jane Smith" />
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <Label for="demo-email" required>Email</Label>
        <Input id="demo-email" type="email" placeholder="you@example.com" />
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <Label for="demo-disabled">Disabled field</Label>
        <Input id="demo-disabled" placeholder="Not editable" disabled />
      </div>
    </div>
  </section>
</DemoPage>